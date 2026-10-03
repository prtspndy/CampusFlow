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
    expect(memoryAnnouncements()[0]?.publishedAt).toBeNull();
  });

  it('retries an order-number collision without decrementing stock twice', async () => {
    const admin = await login('admin@campus.edu', 'ADMIN');
    const member = await login('ada@campus.edu');
    const created = await createHoodie(admin.token);
    const productId = created.body.data.id as string;
    const create = prisma.merchOrder.create as unknown as {
      getMockImplementation: () => ((args: unknown) => Promise<unknown>) | undefined;
      mockImplementation: (impl: (args: unknown) => Promise<unknown>) => void;
    };
    const original = create.getMockImplementation();
    let calls = 0;
    create.mockImplementation(async (args) => {
      calls += 1;
      if (calls === 1) {
        const error = new Error('Unique constraint failed') as Error & {
          code: string;
          meta: { target: string[] };
        };
        error.code = 'P2002';
        error.meta = { target: ['orderNumber'] };
        throw error;
      }
      if (!original) throw new Error('Order create mock is missing');
      return original(args);
    });

    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${member.token}`)
      .send({ items: [{ productId, size: 'M', quantity: 1 }] });

    expect(response.status).toBe(201);
    expect(calls).toBe(2);
    expect(memoryVariants().find((row) => row.size === 'M')?.stock).toBe(4);
    expect(memoryMerchOrders()).toHaveLength(1);
  });

  describe('GET /api/orders (List All Orders - Admin & Treasurer)', () => {
    it('requires authentication for GET /api/orders', async () => {
      const res = await request(app).get('/api/orders');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('forbids members and event managers without orders.read_all permission', async () => {
      const member = await login('member-no-orders@campus.edu', 'MEMBER');
      const manager = await login('manager-no-orders@campus.edu', 'EVENT_MANAGER');

      const memberRes = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${member.token}`);
      expect(memberRes.status).toBe(403);
      expect(memberRes.body.error.code).toBe('FORBIDDEN');

      const managerRes = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${manager.token}`);
      expect(managerRes.status).toBe(403);
      expect(managerRes.body.error.code).toBe('FORBIDDEN');
    });

    it('allows treasurer and admin to retrieve orders with empty list envelope', async () => {
      const treasurer = await login('treasurer-empty-orders@campus.edu', 'TREASURER');
      const admin = await login('admin-empty-orders@campus.edu', 'ADMIN');

      const treasurerRes = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${treasurer.token}`);
      expect(treasurerRes.status).toBe(200);
      expect(treasurerRes.body.success).toBe(true);
      expect(treasurerRes.body.data.orders).toEqual([]);
      expect(treasurerRes.body.data.pagination).toEqual({
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      const adminRes = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${admin.token}`);
      expect(adminRes.status).toBe(200);
      expect(adminRes.body.data.orders).toEqual([]);
    });

    it('lists all placed orders with items, pricing snapshots, and buyer details', async () => {
      const admin = await login('admin-order-list@campus.edu', 'ADMIN');
      const treasurer = await login('treasurer-order-list@campus.edu', 'TREASURER');
      const ada = await login('ada-buyer@campus.edu', 'MEMBER');
      const grace = await login('grace-buyer@campus.edu', 'MEMBER');

      const created = await createHoodie(admin.token);
      const productId = created.body.data.id as string;

      const order1Res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${ada.token}`)
        .send({
          items: [{ productId, size: 'M', quantity: 2 }],
        });
      expect(order1Res.status).toBe(201);

      const order2Res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${grace.token}`)
        .send({
          items: [{ productId, size: 'L', quantity: 1 }],
        });
      expect(order2Res.status).toBe(201);

      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${treasurer.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orders).toHaveLength(2);
      expect(res.body.data.pagination.total).toBe(2);

      const orderItem = res.body.data.orders.find(
        (o: { id: string }) => o.id === order1Res.body.data.order.id,
      );
      expect(orderItem).toBeDefined();
      expect(orderItem.userId).toBe(ada.user.id);
      expect(orderItem.items[0]).toMatchObject({
        productName: 'Club Hoodie',
        size: 'M',
        quantity: 2,
        unitPrice: 1000,
        lineTotal: 2000,
      });
      expect(orderItem.user).toMatchObject({
        id: ada.user.id,
        email: ada.user.email,
      });
    });

    it('supports pagination and validates query parameters on /api/orders', async () => {
      const admin = await login('admin-order-page@campus.edu', 'ADMIN');
      const treasurer = await login('treasurer-order-page@campus.edu', 'TREASURER');
      const member = await login('member-order-page@campus.edu', 'MEMBER');

      const created = await createHoodie(admin.token, {
        variants: [
          { size: 'M', stock: 20 },
          { size: 'L', stock: 20 },
        ],
      });
      const productId = created.body.data.id as string;

      await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${member.token}`)
        .send({ items: [{ productId, size: 'M', quantity: 1 }] });
      await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${member.token}`)
        .send({ items: [{ productId, size: 'L', quantity: 1 }] });

      const page1Res = await request(app)
        .get('/api/orders?page=1&limit=1')
        .set('Authorization', `Bearer ${treasurer.token}`);

      expect(page1Res.status).toBe(200);
      expect(page1Res.body.data.orders).toHaveLength(1);
      expect(page1Res.body.data.pagination).toEqual({
        total: 2,
        page: 1,
        limit: 1,
        totalPages: 2,
      });

      const zeroPage = await request(app)
        .get('/api/orders?page=0')
        .set('Authorization', `Bearer ${treasurer.token}`);
      expect(zeroPage.status).toBe(422);
      expect(zeroPage.body.error.code).toBe('VALIDATION_ERROR');

      const overLimit = await request(app)
        .get('/api/orders?limit=101')
        .set('Authorization', `Bearer ${treasurer.token}`);
      expect(overLimit.status).toBe(422);
      expect(overLimit.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/announcements/manage (Manage Announcements)', () => {
    it('requires authentication for GET /api/announcements/manage', async () => {
      const res = await request(app).get('/api/announcements/manage');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('forbids regular members without announcement management permissions', async () => {
      const member = await login('member-no-manage@campus.edu', 'MEMBER');

      const res = await request(app)
        .get('/api/announcements/manage')
        .set('Authorization', `Bearer ${member.token}`);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('returns empty list envelope when no announcements exist', async () => {
      const admin = await login('admin-empty-ann@campus.edu', 'ADMIN');

      const res = await request(app)
        .get('/api/announcements/manage')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.announcements).toEqual([]);
      expect(res.body.data.pagination).toEqual({
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
    });

    it('restricts event managers to viewing only their own announcements', async () => {
      const manager1 = await login('manager1@campus.edu', 'EVENT_MANAGER');
      const manager2 = await login('manager2@campus.edu', 'EVENT_MANAGER');
      const admin = await login('admin-ann-manage@campus.edu', 'ADMIN');

      // Manager 1 drafts an announcement
      const m1Ann = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${manager1.token}`)
        .send({
          title: 'Manager 1 Workshop Notice',
          body: 'Detailed instructions for upcoming workshop attendees.',
        });
      expect(m1Ann.status).toBe(201);

      // Manager 2 drafts an announcement
      const m2Ann = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${manager2.token}`)
        .send({
          title: 'Manager 2 Volunteer Call',
          body: 'Volunteers needed for next week campus orientation.',
        });
      expect(m2Ann.status).toBe(201);

      // Admin drafts an announcement
      await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          title: 'Admin General Notice',
          body: 'CampusFlow general guidelines for registered members.',
        });

      // Manager 1 requests manage list
      const m1List = await request(app)
        .get('/api/announcements/manage')
        .set('Authorization', `Bearer ${manager1.token}`);

      expect(m1List.status).toBe(200);
      expect(m1List.body.data.announcements).toHaveLength(1);
      expect(m1List.body.data.announcements[0].id).toBe(m1Ann.body.data.id);
      expect(m1List.body.data.announcements[0].authorId).toBe(manager1.user.id);
      expect(m1List.body.data.announcements[0].authorName).toBe(manager1.user.name);

      // Manager 2 requests manage list
      const m2List = await request(app)
        .get('/api/announcements/manage')
        .set('Authorization', `Bearer ${manager2.token}`);

      expect(m2List.status).toBe(200);
      expect(m2List.body.data.announcements).toHaveLength(1);
      expect(m2List.body.data.announcements[0].id).toBe(m2Ann.body.data.id);
      expect(m2List.body.data.announcements[0].authorId).toBe(manager2.user.id);
      expect(m2List.body.data.announcements[0].authorName).toBe(manager2.user.name);
    });

    it('allows admins to view all announcements across all authors', async () => {
      const admin = await login('admin-view-all@campus.edu', 'ADMIN');
      const manager = await login('manager-view-all@campus.edu', 'EVENT_MANAGER');

      await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${manager.token}`)
        .send({
          title: 'Manager Draft Post',
          body: 'Draft body written by event manager.',
        });

      await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          title: 'Admin Draft Post',
          body: 'Draft body written by organization admin.',
        });

      const adminList = await request(app)
        .get('/api/announcements/manage')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(adminList.status).toBe(200);
      expect(adminList.body.data.announcements).toHaveLength(2);
      expect(adminList.body.data.pagination.total).toBe(2);
    });

    it('supports search query filtering by title or body on /api/announcements/manage', async () => {
      const admin = await login('admin-search@campus.edu', 'ADMIN');

      await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          title: 'Annual Hackathon Registration',
          body: 'Registration is now open for our annual overnight hackathon.',
        });

      await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${admin.token}`)
        .send({
          title: 'Lost Property Notice',
          body: 'Items left behind in the auditorium have been collected.',
        });

      const hackathonSearch = await request(app)
        .get('/api/announcements/manage?search=hackathon')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(hackathonSearch.status).toBe(200);
      expect(hackathonSearch.body.data.announcements).toHaveLength(1);
      expect(hackathonSearch.body.data.announcements[0].title).toBe('Annual Hackathon Registration');

      const bodySearch = await request(app)
        .get('/api/announcements/manage?search=auditorium')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(bodySearch.status).toBe(200);
      expect(bodySearch.body.data.announcements).toHaveLength(1);
      expect(bodySearch.body.data.announcements[0].title).toBe('Lost Property Notice');
    });

    it('validates query parameters with 422 on /api/announcements/manage', async () => {
      const admin = await login('admin-val@campus.edu', 'ADMIN');

      const invalidPage = await request(app)
        .get('/api/announcements/manage?page=0')
        .set('Authorization', `Bearer ${admin.token}`);

      expect(invalidPage.status).toBe(422);
      expect(invalidPage.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});

