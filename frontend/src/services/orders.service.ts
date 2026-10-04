import { apiClient } from '../lib/api-client';
import { ApiResponse } from '../types/api';
import { CreateOrderInput, Order } from '../types/commerce';

export interface ListOrdersResult {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
}

function normalizeOrders(
  data:
    | (ListOrdersResult & {
        pagination?: { total?: number; page?: number; limit?: number };
      })
    | undefined,
  params?: { page?: number; limit?: number },
): ListOrdersResult {
  const pagination = data?.pagination;
  return {
    orders: data?.orders ?? [],
    total: data?.total ?? pagination?.total ?? 0,
    page: data?.page ?? pagination?.page ?? params?.page ?? 1,
    limit: data?.limit ?? pagination?.limit ?? params?.limit ?? 20,
  };
}

export const ordersService = {
  async createOrder(input: CreateOrderInput): Promise<Order> {
    const response = await apiClient.post<ApiResponse<Order>>('/orders', input);
    return response.data.data;
  },

  async getMyOrders(params?: { page?: number; limit?: number }): Promise<ListOrdersResult> {
    const response = await apiClient.get<ApiResponse<ListOrdersResult>>('/orders/me', { params });
    return normalizeOrders(response.data.data, params);
  },

  async listAllOrders(params?: { page?: number; limit?: number }): Promise<ListOrdersResult> {
    const response = await apiClient.get<ApiResponse<ListOrdersResult>>('/orders', { params });
    return normalizeOrders(response.data.data, params);
  },

  async getOrderById(orderId: string): Promise<Order> {
    const response = await apiClient.get<ApiResponse<Order>>(`/orders/${orderId}`);
    return response.data.data;
  },

  async cancelOrder(orderId: string): Promise<Order> {
    const response = await apiClient.post<ApiResponse<Order>>(`/orders/${orderId}/cancel`);
    return response.data.data;
  },
};
