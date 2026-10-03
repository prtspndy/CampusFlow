import crypto from 'node:crypto';
import { MembershipStatus, MerchOrderStatus, Prisma, ProductStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { isPrismaCode } from '../lib/prisma-errors.js';
import { AuthenticatedUser, hasPermission } from '../types/auth.js';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/errors.js';
import { CreateOrderInput } from '../validators/phase4.validators.js';

type Tx = Prisma.TransactionClient;

function presentOrder(order: {
  id: string;
  orderNumber: string;
  userId: string;
  status: MerchOrderStatus;
  totalAmount: number;
  currency: string;
  createdAt: Date;
  cancelledAt: Date | null;
  items: Array<{
    productId: string;
    productName: string;
    size: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
}) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    userId: order.userId,
    status: order.status,
    totalAmount: order.totalAmount,
    currency: order.currency,
    shippingOrPickup: 'PICKUP' as const,
    createdAt: order.createdAt,
    cancelledAt: order.cancelledAt,
    items: order.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      size: item.size,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    })),
  };
}

const orderInclude = { items: true };

async function memberPriceApplies(tx: Tx, userId: string): Promise<boolean> {
  const membership = await tx.membership.findFirst({
    where: {
      userId,
      status: MembershipStatus.ACTIVE,
      validUntil: { gt: new Date() },
    },
  });
  return Boolean(membership);
}

export async function createOrder(user: AuthenticatedUser, input: CreateOrderInput) {
  const idempotencyKey = input.idempotencyKey ? `${user.id}:${input.idempotencyKey}` : null;
  if (idempotencyKey) {
    const existing = await prisma.merchOrder.findUnique({
      where: { idempotencyKey },
      include: orderInclude,
    });
    if (existing) return { order: presentOrder(existing), alreadyExisted: true };
  }

  try {
    let alreadyExisted = false;
    const order = await prisma.$transaction(async (tx) => {
      if (idempotencyKey) {
        const existing = await tx.merchOrder.findUnique({
          where: { idempotencyKey },
          include: orderInclude,
        });
        if (existing) {
          alreadyExisted = true;
          return existing;
        }
      }

      const member = await memberPriceApplies(tx, user.id);
      const lines: Prisma.MerchOrderItemCreateWithoutOrderInput[] = [];

      for (const item of input.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { variants: true },
        });
        if (!product) throw new NotFoundError('Product not found');
        if (product.status !== ProductStatus.ACTIVE) {
          throw new ConflictError(`${product.name} is not available`, 'PRODUCT_UNAVAILABLE');
        }
        const variant = product.variants.find((entry) => entry.size === item.size);
        if (!variant) {
          throw new BadRequestError(`${product.name} is not offered in size ${item.size}`);
        }

        const reserved = await tx.productVariant.updateMany({
          where: { id: variant.id, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (reserved.count !== 1) {
          throw new ConflictError(`Not enough stock for ${product.name} (${item.size})`, 'INSUFFICIENT_STOCK');
        }

        const unitPrice = member ? product.memberPrice : product.standardPrice;
        lines.push({
          product: { connect: { id: product.id } },
          size: item.size,
          productName: product.name,
          unitPrice,
          quantity: item.quantity,
          lineTotal: unitPrice * item.quantity,
        });
      }

      const totalAmount = lines.reduce((sum, line) => sum + line.lineTotal, 0);
      return tx.merchOrder.create({
        data: {
          userId: user.id,
          orderNumber: `CFM-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
          status: MerchOrderStatus.PLACED,
          totalAmount,
          currency: 'INR',
          idempotencyKey,
          items: { create: lines },
        },
        include: orderInclude,
      });
    });
    return { order: presentOrder(order), alreadyExisted };
  } catch (error) {
    if (isPrismaCode(error, 'P2002') && idempotencyKey) {
      const existing = await prisma.merchOrder.findUnique({
        where: { idempotencyKey },
        include: orderInclude,
      });
      if (existing) return { order: presentOrder(existing), alreadyExisted: true };
    }
    throw error;
  }
}

export async function listOwnOrders(userId: string, page: number, limit: number) {
  const where = { userId };
  const [total, rows] = await Promise.all([
    prisma.merchOrder.count({ where }),
    prisma.merchOrder.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);
  return {
    orders: rows.map(presentOrder),
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
  };
}

export async function listAllOrders(page: number, limit: number) {
  const [total, rows] = await Promise.all([
    prisma.merchOrder.count(),
    prisma.merchOrder.findMany({
      include: { ...orderInclude, user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);
  return {
    orders: rows.map((row) => ({ ...presentOrder(row), user: row.user })),
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
  };
}

export async function getOrder(user: AuthenticatedUser, orderId: string) {
  const order = await prisma.merchOrder.findUnique({ where: { id: orderId }, include: orderInclude });
  if (!order) throw new NotFoundError('Order not found');
  const canReadAll = hasPermission(user.role, 'orders.read_all');
  if (order.userId !== user.id && !canReadAll) throw new NotFoundError('Order not found');
  return presentOrder(order);
}

export async function cancelOrder(user: AuthenticatedUser, orderId: string) {
  const existing = await prisma.merchOrder.findUnique({ where: { id: orderId }, include: orderInclude });
  if (!existing) throw new NotFoundError('Order not found');
  const canManage = hasPermission(user.role, 'merchandise.manage');
  if (existing.userId !== user.id && !canManage) throw new NotFoundError('Order not found');

  await prisma.$transaction(async (tx) => {
    const cancelled = await tx.merchOrder.updateMany({
      where: { id: orderId, status: MerchOrderStatus.PLACED },
      data: { status: MerchOrderStatus.CANCELLED, cancelledAt: new Date() },
    });
    if (cancelled.count !== 1) {
      throw new ConflictError('Order cannot be cancelled', 'ORDER_NOT_CANCELLABLE');
    }
    for (const item of existing.items) {
      await tx.productVariant.updateMany({
        where: { productId: item.productId, size: item.size },
        data: { stock: { increment: item.quantity } },
      });
    }
  });

  const updated = await prisma.merchOrder.findUnique({ where: { id: orderId }, include: orderInclude });
  if (!updated) throw new NotFoundError('Order not found');
  return presentOrder(updated);
}
