import { apiClient } from '../lib/api-client';
import { ApiResponse } from '../types/api';
import { CreateOrderInput, Order } from '../types/commerce';

export interface ListOrdersResult {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
}

export const ordersService = {
  async createOrder(input: CreateOrderInput): Promise<Order> {
    const response = await apiClient.post<ApiResponse<Order>>('/orders', input);
    return response.data.data;
  },

  async getMyOrders(params?: { page?: number; limit?: number }): Promise<ListOrdersResult> {
    const response = await apiClient.get<ApiResponse<ListOrdersResult>>('/orders/me', { params });
    return response.data.data;
  },

  async listAllOrders(params?: { page?: number; limit?: number }): Promise<ListOrdersResult> {
    const response = await apiClient.get<ApiResponse<ListOrdersResult>>('/orders', { params });
    return response.data.data;
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
