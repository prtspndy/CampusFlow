import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const enabled = process.env.PHASE4_POSTGRES === '1';
const password = 'Password1';

describe.skipIf(!enabled)('Phase 4 PostgreSQL inventory', () => {
  beforeAll(async () => {
    const url = process.env.DATABASE_URL ?? '';
    const isLocal = /@((127\.0\.0\.1)|localhost)[:/]/.test(url);
    const isIsolatedTestDb = /\/campusflow_phase4_test(\?|$)/.test(url) && !/\/neondb(\?|$)/.test(url);
    if (!isLocal && !isIsolatedTestDb) {
      throw new Error('Refusing to run against non-isolated database');
    }
    await prisma.$queryRaw`SELECT 1`;
    await prisma.product.count();
  });

  beforeEach(async () => {
    await prisma.merchOrderItem.deleteMany();
    await prisma.merchOrder.deleteMany();
    await prisma.productVariant.deleteMany();
    await prisma.product.deleteMany();
    await prisma.announcement.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.membership.deleteMany();
    await prisma.user.deleteMany();
  });

  async function login(email: string, role: 'MEMBER' | 'ADMIN' = 'MEMBER') {
    await request(app).post('/api/auth/register').send({
      name: email.split('@')[0],
      email,
      password,
    });
    if (role === 'ADMIN') {
      await prisma.user.update({ where: { email }, data: { role: 'ADMIN' } });
    }
    const response = await request(app).post('/api/auth/login').send({ email, password });
    return response.body.data.token as string;
  }

  async function createProduct(token: string, stockM: number, stockL = 5) {
    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Club Hoodie',
        description: 'Official heavyweight hoodie for club members.',
        category: 'Apparel',
        sku: `HOODIE-${Date.now()}`,
        memberPrice: 800,
        standardPrice: 1000,
        variants: [
          { size: 'M', stock: stockM },
          { size: 'L', stock: stockL },
        ],
      });
    expect(response.status).toBe(201);
    return response.body.data.id as string;
  }

  async function stockOf(productId: string, size: string) {
    const variant = await prisma.productVariant.findUnique({
      where: { productId_size: { productId, size } },
    });
    return variant?.stock;
  }

  it('lets only one purchase take the final unit', async () => {
    const admin = await login('admin-pg@campus.edu', 'ADMIN');
    const first = await login('ada-pg@campus.edu');
    const second = await login('grace-pg@campus.edu');
    const productId = await createProduct(admin, 1, 0);

    const [left, right] = await Promise.all([
      request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${first}`)
        .send({ items: [{ productId, size: 'M', quantity: 1 }] }),
      request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${second}`)
        .send({ items: [{ productId, size: 'M', quantity: 1 }] }),
    ]);

    expect([left.status, right.status].sort()).toEqual([201, 409]);
    expect(await stockOf(productId, 'M')).toBe(0);
    expect(await prisma.merchOrder.count()).toBe(1);
  });

  it('does not let concurrent orders of 4 and 3 oversell 5 units', async () => {
    const admin = await login('admin-pg2@campus.edu', 'ADMIN');
    const first = await login('ada-pg2@campus.edu');
    const second = await login('grace-pg2@campus.edu');
    const productId = await createProduct(admin, 5);

    const [left, right] = await Promise.all([
      request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${first}`)
        .send({ items: [{ productId, size: 'M', quantity: 4 }] }),
      request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${second}`)
        .send({ items: [{ productId, size: 'M', quantity: 3 }] }),
    ]);

    expect([left.status, right.status].sort()).toEqual([201, 409]);
    const stock = await stockOf(productId, 'M');
    const sold = stock === 1 ? 4 : 3;
    expect(stock).toBeGreaterThanOrEqual(0);
    expect((stock ?? 0) + sold).toBe(5);
    expect(await prisma.merchOrder.count()).toBe(1);
  });

  it('rolls back a multi-item order when one size is short', async () => {
    const admin = await login('admin-pg3@campus.edu', 'ADMIN');
    const member = await login('ada-pg3@campus.edu');
    const productId = await createProduct(admin, 5, 0);

    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${member}`)
      .send({
        items: [
          { productId, size: 'M', quantity: 2 },
          { productId, size: 'L', quantity: 1 },
        ],
      });

    expect(response.status).toBe(409);
    expect(await stockOf(productId, 'M')).toBe(5);
    expect(await stockOf(productId, 'L')).toBe(0);
    expect(await prisma.merchOrder.count()).toBe(0);
  });

  it('does not let a stale admin save erase a concurrent purchase', async () => {
    const admin = await login('admin-pg4@campus.edu', 'ADMIN');
    const member = await login('ada-pg4@campus.edu');
    const productId = await createProduct(admin, 10, 2);

    const [saved, bought] = await Promise.all([
      request(app)
        .patch(`/api/products/${productId}/stock`)
        .set('Authorization', `Bearer ${admin}`)
        .send({ size: 'M', stock: 10, expectedStock: 10 }),
      request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${member}`)
        .send({ items: [{ productId, size: 'M', quantity: 3 }] }),
    ]);

    expect(bought.status).toBe(201);
    expect(await prisma.merchOrder.count()).toBe(1);
    expect(await stockOf(productId, 'M')).toBe(7);
    if (saved.status === 409) {
      expect(saved.body.error.code).toBe('STOCK_CONFLICT');
    } else {
      expect(saved.status).toBe(200);
    }
  });

  it('returns the same order for a repeated idempotency key', async () => {
    const admin = await login('admin-pg5@campus.edu', 'ADMIN');
    const member = await login('ada-pg5@campus.edu');
    const productId = await createProduct(admin, 8);
    const body = {
      idempotencyKey: 'pickup-once',
      items: [{ productId, size: 'M', quantity: 2 }],
    };

    const first = await request(app).post('/api/orders').set('Authorization', `Bearer ${member}`).send(body);
    const second = await request(app).post('/api/orders').set('Authorization', `Bearer ${member}`).send(body);

    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.body.data.order.id).toBe(first.body.data.order.id);
    expect(await stockOf(productId, 'M')).toBe(6);
    expect(await prisma.merchOrder.count()).toBe(1);
  });

  it('restores stock once when cancellation is repeated', async () => {
    const admin = await login('admin-pg6@campus.edu', 'ADMIN');
    const member = await login('ada-pg6@campus.edu');
    const productId = await createProduct(admin, 6);
    const placed = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${member}`)
      .send({ items: [{ productId, size: 'M', quantity: 2 }] });
    const orderId = placed.body.data.order.id as string;

    const first = await request(app)
      .post(`/api/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${member}`);
    const second = await request(app)
      .post(`/api/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${member}`);

    expect(first.status).toBe(200);
    expect(second.status).toBe(409);
    expect(await stockOf(productId, 'M')).toBe(6);
  });
});
