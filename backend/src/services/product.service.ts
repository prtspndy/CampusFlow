import { Prisma, ProductStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { isPrismaCode } from '../lib/prisma-errors.js';
import { ConflictError, NotFoundError } from '../utils/errors.js';
import {
  AdjustStockInput,
  CreateProductInput,
  ListProductsQuery,
  UpdateProductInput,
} from '../validators/phase4.validators.js';

const productInclude = { variants: { orderBy: { size: 'asc' as const } } };

function presentProduct(product: {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  category: string;
  sku: string | null;
  memberPrice: number;
  standardPrice: number;
  status: ProductStatus;
  createdAt: Date;
  updatedAt: Date;
  variants: Array<{ size: string; stock: number }>;
}) {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    imageUrl: product.imageUrl,
    category: product.category,
    sku: product.sku,
    memberPrice: product.memberPrice,
    standardPrice: product.standardPrice,
    status: product.status,
    isAvailable: product.status === ProductStatus.ACTIVE,
    sizes: product.variants.map((variant) => ({ size: variant.size, stock: variant.stock })),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

export async function listProducts(query: ListProductsQuery, includeInactive: boolean) {
  const where: Prisma.ProductWhereInput = {};
  if (!includeInactive) {
    where.status = ProductStatus.ACTIVE;
  } else if (query.status) {
    where.status = query.status;
  }
  if (query.category) where.category = query.category;
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
      { sku: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: { [query.sort]: query.direction },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
  ]);

  return {
    products: rows.map(presentProduct),
    pagination: {
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit) || 1,
    },
  };
}

export async function getProduct(productId: string, includeInactive: boolean) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: productInclude,
  });
  if (!product || (!includeInactive && product.status !== ProductStatus.ACTIVE)) {
    throw new NotFoundError('Product not found');
  }
  return presentProduct(product);
}

export async function createProduct(input: CreateProductInput) {
  try {
    const product = await prisma.product.create({
      data: {
        name: input.name,
        description: input.description,
        imageUrl: input.imageUrl,
        category: input.category,
        sku: input.sku,
        memberPrice: input.memberPrice,
        standardPrice: input.standardPrice,
        status: input.status,
        variants: { create: input.variants },
      },
      include: productInclude,
    });
    return presentProduct(product);
  } catch (error) {
    if (isPrismaCode(error, 'P2002')) {
      throw new ConflictError('A product with this SKU already exists', 'DUPLICATE_SKU');
    }
    throw error;
  }
}

export async function updateProduct(productId: string, input: UpdateProductInput) {
  const existing = await prisma.product.findUnique({ where: { id: productId } });
  if (!existing) throw new NotFoundError('Product not found');
  try {
    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.sku !== undefined ? { sku: input.sku } : {}),
        ...(input.memberPrice !== undefined ? { memberPrice: input.memberPrice } : {}),
        ...(input.standardPrice !== undefined ? { standardPrice: input.standardPrice } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
      },
      include: productInclude,
    });
    return presentProduct(product);
  } catch (error) {
    if (isPrismaCode(error, 'P2002')) {
      throw new ConflictError('A product with this SKU already exists', 'DUPLICATE_SKU');
    }
    throw error;
  }
}

export async function setVariantStock(productId: string, input: AdjustStockInput) {
  const variant = await prisma.productVariant.findUnique({
    where: { productId_size: { productId, size: input.size } },
  });
  if (!variant) throw new NotFoundError('That size is not stocked for this product');

  // The write matches the stock the admin loaded. A purchase that committed
  // in between changes the row, so this update matches nothing and is rejected.
  const updated = await prisma.productVariant.updateMany({
    where: { id: variant.id, stock: input.expectedStock },
    data: { stock: input.stock },
  });
  if (updated.count !== 1) {
    const current = await prisma.productVariant.findUnique({ where: { id: variant.id } });
    throw new ConflictError(
      'Stock changed since you loaded it. Reload the current quantity and save again.',
      'STOCK_CONFLICT',
      [
        {
          field: 'expectedStock',
          message: `Current stock for size ${input.size} is ${current?.stock ?? 'unknown'}`,
          size: input.size,
          stock: current?.stock ?? null,
        },
      ],
    );
  }
  return getProduct(productId, true);
}
