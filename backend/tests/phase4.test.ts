import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';
import {
  insertUser,
  installPrismaMemory,
  memoryAnnouncements,
  memoryMerchOrders,
  memoryVariants,
  resetMemoryDb,
} from './helpers/memory-prisma.js';

const password = 'Password1';

describe('Phase 4 merchandise, orders, and announcements', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetMemoryDb();
    installPrismaMemory();
  });

  async function login(email: string, role: 'MEMBER' | 'EVENT_MANAGER' | 'TREASURER' | 'ADMIN' = 'MEMBER') {
    const passwordHash = await bcrypt.hash(password, 4);
    const user = insertUser({ email, name: email.split('@')[0] ?? 'User', passwordHash, role });
    const response = await request(app).post('/api/auth/login').send({ email, password });
    return { user, token: response.body.data.token as string };
  }

  const productBody = {
    name: 'Club Hoodie',
    description: 'Official heavyweight hoodie for club members.',
    category: 'Apparel',
    sku: 'HOODIE-NAVY',
    memberPrice: 800,
    standardPrice: 1000,
    variants: [
      { size: 'M', stock: 5 },
      { size: 'L', stock: 2 },
    ],
  };

  async function createHoodie(token: string, overrides: Record<string, unknown> = {}) {
    return request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...productBody, ...overrides });
  }

  it('lets an admin create a product and hides inactive products from the catalogue', async () => {
    const admin = await login('admin@campus.edu', 'ADMIN');
    const member = await login('ada@campus.edu');
    const created = await createHoodie(admin.token);
    expect(created.status).toBe(201);
    expect(created.body.data.sizes).toEqual([
      { size: 'M', stock: 5 },
      { size: 'L', stock: 2 },
    ]);

    const forbidden = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${member.token}`)
      .send(productBody);
    expect(forbidden.status).toBe(403);

    const unauthenticated = await request(app).post('/api/products').send({ ...productBody, sku: 'OTHER' });
    expect(unauthenticated.status).toBe(401);

    const invalid = await createHoodie(admin.token, { sku: 'BAD-PRICE', memberPrice: -1 });
    expect(invalid.status).toBe(422);

    const duplicate = await createHoodie(admin.token);
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe('DUPLICATE_SKU');

    await request(app)
      .patch(`/api/products/${created.body.data.id}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ status: 'INACTIVE' });

    const catalogue = await request(app).get('/api/products');
    expect(catalogue.status).toBe(200);
    expect(catalogue.body.data.products).toHaveLength(0);

    const hidden = await request(app).get(`/api/products/${created.body.data.id}`);
    expect(hidden.status).toBe(404);

    const adminView = await request(app)
      .get(`/api/products/${created.body.data.id}`)
      .set('Authorization', `Bearer ${admin.token}`);
    expect(adminView.status).toBe(200);
    expect(adminView.body.data.status).toBe('INACTIVE');
  });

  it('rejects purchases of missing, inactive, zero, and over-stock items without changing stock', async () => {
    const admin = await login('admin@campus.edu', 'ADMIN');
    const member = await login('ada@campus.edu');
    const created = await createHoodie(admin.token);
    const productId = created.body.data.id as string;

    const missing = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${member.token}`)
      .send({
        items: [{ productId: '11111111-1111-4111-8111-111111111111', size: 'M', quantity: 1 }],
      });
    expect(missing.status).toBe(404);

    await request(app)
      .patch(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ status: 'INACTIVE' });
    const inactive = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${member.token}`)
      .send({ items: [{ productId, size: 'M', quantity: 1 }] });
    expect(inactive.status).toBe(409);
    expect(inactive.body.error.code).toBe('PRODUCT_UNAVAILABLE');

    await request(app)
      .patch(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ status: 'ACTIVE' });
    const zero = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${member.token}`)
      .send({ items: [{ productId, size: 'M', quantity: 0 }] });
    expect(zero.status).toBe(422);

    const tooMany = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${member.token}`)
      .send({ items: [{ productId, size: 'M', quantity: 9 }] });
    expect(tooMany.status).toBe(409);
    expect(tooMany.body.error.code).toBe('INSUFFICIENT_STOCK');
    expect(memoryVariants().find((row) => row.size === 'M')?.stock).toBe(5);
    expect(memoryMerchOrders()).toHaveLength(0);
  });

  it('places an order at the database price, snapshots it, and blocks another user from reading it', async () => {
    const admin = await login('admin@campus.edu', 'ADMIN');
    const member = await login('ada@campus.edu');
    const other = await login('grace@campus.edu');
    const created = await createHoodie(admin.token);
    const productId = created.body.data.id as string;

    const placed = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${member.token}`)
      .send({
        idempotencyKey: 'checkout-ada-001',
        items: [
          { productId, size: 'M', quantity: 2, unitPrice: 1 },
          { productId, size: 'L', quantity: 1 },
        ],
      });
    expect(placed.status).toBe(201);
    expect(placed.body.data.order.totalAmount).toBe(3000);
    expect(placed.body.data.order.items[0].unitPrice).toBe(1000);
    expect(memoryVariants().find((row) => row.size === 'M')?.stock).toBe(3);

    await request(app)
      .patch(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ standardPrice: 1500, name: 'Renamed Hoodie' });

    const mine = await request(app)
      .get('/api/orders/me')
      .set('Authorization', `Bearer ${member.token}`);
    expect(mine.body.data.orders[0].items[0].productName).toBe('Club Hoodie');
    expect(mine.body.data.orders[0].items[0].unitPrice).toBe(1000);

    const foreign = await request(app)
      .get(`/api/orders/${placed.body.data.order.id}`)
      .set('Authorization', `Bearer ${other.token}`);
    expect(foreign.status).toBe(404);

    const guest = await request(app).post('/api/orders').send({ items: [{ productId, size: 'M', quantity: 1 }] });
    expect(guest.status).toBe(401);

    const repeat = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${member.token}`)
      .send({
        idempotencyKey: 'checkout-ada-001',
        items: [{ productId, size: 'M', quantity: 2 }],
      });
    expect(repeat.status).toBe(200);
    expect(repeat.body.data.alreadyExisted).toBe(true);
    expect(memoryMerchOrders()).toHaveLength(1);
    expect(memoryVariants().find((row) => row.size === 'M')?.stock).toBe(3);
  });

  it('keeps stock when one line in a multi-item order cannot be filled and when creation fails', async () => {
    const admin = await login('admin@campus.edu', 'ADMIN');
    const member = await login('ada@campus.edu');
    const created = await createHoodie(admin.token);
    const productId = created.body.data.id as string;

    const partial = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${member.token}`)
      .send({
        items: [
          { productId, size: 'M', quantity: 1 },
          { productId, size: 'L', quantity: 9 },
        ],
      });
    expect(partial.status).toBe(409);
    expect(memoryVariants().find((row) => row.size === 'M')?.stock).toBe(5);
    expect(memoryMerchOrders()).toHaveLength(0);

    const create = prisma.merchOrder.create as unknown as {
      mockImplementationOnce: (impl: () => Promise<never>) => void;
    };
    create.mockImplementationOnce(() => Promise.reject(new Error('database unavailable')));
    const failed = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${member.token}`)
      .send({ items: [{ productId, size: 'M', quantity: 1 }] });
    expect(failed.status).toBe(500);
    expect(memoryVariants().find((row) => row.size === 'M')?.stock).toBe(5);
    expect(memoryMerchOrders()).toHaveLength(0);
  });

  it('does not oversell when concurrent orders compete for the last units', async () => {
    const admin = await login('admin@campus.edu', 'ADMIN');
    const first = await login('ada@campus.edu');
    const second = await login('grace@campus.edu');
    const created = await createHoodie(admin.token);
    const productId = created.body.data.id as string;

    const [left, right] = await Promise.all([
      request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${first.token}`)
        .send({ items: [{ productId, size: 'M', quantity: 4 }] }),
      request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${second.token}`)
        .send({ items: [{ productId, size: 'M', quantity: 3 }] }),
    ]);
    const statuses = [left.status, right.status].sort();
    expect(statuses).toEqual([201, 409]);
    const stock = memoryVariants().find((row) => row.size === 'M')?.stock ?? -1;
    expect(stock).toBeGreaterThanOrEqual(0);
    expect(stock).toBeLessThanOrEqual(5);
    const sold = memoryMerchOrders().length === 1 ? (stock === 1 ? 4 : 3) : 0;
    expect(stock + sold).toBe(5);

    const third = await login('nia@campus.edu');
    const fourth = await login('omar@campus.edu');
    await request(app)
      .patch(`/api/products/${productId}/stock`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        size: 'M',
        stock: 1,
        expectedStock: memoryVariants().find((row) => row.size === 'M')?.stock,
      });
    const [one, two] = await Promise.all([
      request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${third.token}`)
        .send({ items: [{ productId, size: 'M', quantity: 1 }] }),
      request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${fourth.token}`)
        .send({ items: [{ productId, size: 'M', quantity: 1 }] }),
    ]);
    expect([one.status, two.status].sort()).toEqual([201, 409]);
    expect(memoryVariants().find((row) => row.size === 'M')?.stock).toBe(0);

    await request(app)
      .patch(`/api/products/${productId}/stock`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ size: 'L', stock: 10, expectedStock: 2 });
    const fifth = await login('priya@campus.edu');
    const sixth = await login('dev@campus.edu');
    const exact = await Promise.all([
      request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${fifth.token}`)
        .send({ items: [{ productId, size: 'L', quantity: 6 }] }),
      request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${sixth.token}`)
        .send({ items: [{ productId, size: 'L', quantity: 4 }] }),
    ]);
    expect(exact.map((response) => response.status).sort()).toEqual([201, 201]);
    expect(memoryVariants().find((row) => row.size === 'L')?.stock).toBe(0);

    await request(app)
      .patch(`/api/products/${productId}/stock`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ size: 'L', stock: 10, expectedStock: 0 });
    const seventh = await login('leela@campus.edu');
    const eighth = await login('kabir@campus.edu');
    const overflow = await Promise.all([
      request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${seventh.token}`)
        .send({ items: [{ productId, size: 'L', quantity: 6 }] }),
      request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${eighth.token}`)
        .send({ items: [{ productId, size: 'L', quantity: 6 }] }),
    ]);
    expect(overflow.map((response) => response.status).sort()).toEqual([201, 409]);
    expect(memoryVariants().find((row) => row.size === 'L')?.stock).toBe(4);
  });

  it('restores stock once when an order is cancelled twice', async () => {
    const admin = await login('admin@campus.edu', 'ADMIN');
    const member = await login('ada@campus.edu');
    const created = await createHoodie(admin.token);
    const productId = created.body.data.id as string;
    const placed = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${member.token}`)
      .send({ items: [{ productId, size: 'M', quantity: 2 }] });
    const orderId = placed.body.data.order.id as string;

    const first = await request(app)
      .post(`/api/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${member.token}`);
    const second = await request(app)
      .post(`/api/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${member.token}`);

    expect(first.status).toBe(200);
    expect(second.status).toBe(409);
    expect(memoryVariants().find((row) => row.size === 'M')?.stock).toBe(5);
  });

  it('rejects a stale admin stock save after a purchase', async () => {
    const admin = await login('admin@campus.edu', 'ADMIN');
    const member = await login('ada@campus.edu');
    const created = await createHoodie(admin.token);
    const productId = created.body.data.id as string;

    const purchased = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${member.token}`)
      .send({ items: [{ productId, size: 'M', quantity: 3 }] });
    expect(purchased.status).toBe(201);

    const stale = await request(app)
      .patch(`/api/products/${productId}/stock`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ size: 'M', stock: 5, expectedStock: 5 });

    expect(stale.status).toBe(409);
    expect(stale.body.error.code).toBe('STOCK_CONFLICT');
    expect(memoryVariants().find((row) => row.size === 'M')?.stock).toBe(2);

    const [saved, bought] = await Promise.all([
      request(app)
        .patch(`/api/products/${productId}/stock`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({ size: 'L', stock: 10, expectedStock: 2 }),
      request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${member.token}`)
        .send({ items: [{ productId, size: 'L', quantity: 1 }] }),
    ]);
    const stock = memoryVariants().find((row) => row.size === 'L')?.stock;
    if (saved.status === 200 && bought.status === 201) {
      expect(stock).toBe(9);
    } else if (saved.status === 409 && bought.status === 201) {
      expect(stock).toBe(1);
    } else {
      expect(saved.status === 200 && bought.status === 409).toBe(true);
      expect(stock).toBe(10);
    }
    expect(stock).not.toBe(2);
  });

  it('publishes announcements without letting members see or edit drafts', async () => {
    const admin = await login('admin@campus.edu', 'ADMIN');
    const manager = await login('events@campus.edu', 'EVENT_MANAGER');
    const member = await login('ada@campus.edu');

    const denied = await request(app)
      .post('/api/announcements')
      .set('Authorization', `Bearer ${member.token}`)
      .send({ title: 'Nope', body: 'Members cannot draft announcements.' });
    expect(denied.status).toBe(403);

    const invalid = await request(app)
      .post('/api/announcements')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ title: 'Hi', body: 'short' });
    expect(invalid.status).toBe(422);

    const draft = await request(app)
      .post('/api/announcements')
      .set('Authorization', `Bearer ${manager.token}`)
      .send({
        title: 'Venue change',
        body: 'The spring gala has moved to the main auditorium tonight.',
      });
    expect(draft.status).toBe(201);
    expect(draft.body.data.status).toBe('DRAFT');

    const publicList = await request(app).get('/api/announcements');
    expect(publicList.body.data.announcements).toHaveLength(0);

    const guessed = await request(app).get(`/api/announcements/${draft.body.data.id}`);
    expect(guessed.status).toBe(404);

    const memberPublish = await request(app)
      .post(`/api/announcements/${draft.body.data.id}/publish`)
      .set('Authorization', `Bearer ${member.token}`);
    expect(memberPublish.status).toBe(403);

    const managerPublish = await request(app)
      .post(`/api/announcements/${draft.body.data.id}/publish`)
      .set('Authorization', `Bearer ${manager.token}`);
    expect(managerPublish.status).toBe(403);

    const published = await request(app)
      .post(`/api/announcements/${draft.body.data.id}/publish`)
      .set('Authorization', `Bearer ${admin.token}`);
    expect(published.status).toBe(200);
    expect(published.body.data.publishedAt).toBeTruthy();

    const visible = await request(app).get('/api/announcements');
    expect(visible.body.data.announcements).toHaveLength(1);

    const edited = await request(app)
      .patch(`/api/announcements/${draft.body.data.id}`)
      .set('Authorization', `Bearer ${member.token}`)
      .send({ title: 'Hijacked title' });
    expect(edited.status).toBe(403);

    await request(app)
      .post(`/api/announcements/${draft.body.data.id}/unpublish`)
      .set('Authorization', `Bearer ${admin.token}`);
    const hiddenAgain = await request(app).get('/api/announcements');
    expect(hiddenAgain.body.data.announcements).toHaveLength(0);
    expect(memoryAnnouncements()[0]?.status).toBe('DRAFT');
  });
});
