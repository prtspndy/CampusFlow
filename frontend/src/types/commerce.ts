import { User } from './auth';

export type ProductStatus = 'ACTIVE' | 'INACTIVE';
export type OrderStatus = 'PLACED' | 'CANCELLED';

export interface ProductVariant {
  id: string;
  productId: string;
  size: string;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  imageUrl?: string | null;
  category: string;
  sku?: string | null;
  memberPrice: number;
  standardPrice: number;
  status: ProductStatus;
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductInput {
  name: string;
  description: string;
  imageUrl?: string;
  category: string;
  sku?: string;
  memberPrice: number;
  standardPrice: number;
  variants: { size: string; stock: number }[];
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  sku?: string;
  memberPrice?: number;
  standardPrice?: number;
  status?: ProductStatus;
}

export interface AdjustStockInput {
  size: string;
  stock: number;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  size: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  product?: Product;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  totalAmount: number;
  currency: string;
  idempotencyKey?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  user?: Pick<User, 'id' | 'name' | 'email'>;
}

export interface CreateOrderInput {
  idempotencyKey?: string;
  items: {
    productId: string;
    size: string;
    quantity: number;
  }[];
}
