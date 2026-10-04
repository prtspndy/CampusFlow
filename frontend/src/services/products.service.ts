import { apiClient } from '../lib/api-client';
import { ApiResponse } from '../types/api';
import { AdjustStockInput, CreateProductInput, Product, UpdateProductInput } from '../types/commerce';

export interface ListProductsResult {
  products: Product[];
  total: number;
  page: number;
  limit: number;
}

export const productsService = {
  async listProducts(params?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ListProductsResult> {
    const response = await apiClient.get<ApiResponse<ListProductsResult>>('/products', { params });
    return response.data.data;
  },

  async getProductById(productId: string): Promise<Product> {
    const response = await apiClient.get<ApiResponse<Product>>(`/products/${productId}`);
    return response.data.data;
  },

  async createProduct(input: CreateProductInput): Promise<Product> {
    const response = await apiClient.post<ApiResponse<Product>>('/products', input);
    return response.data.data;
  },

  async updateProduct(productId: string, input: UpdateProductInput): Promise<Product> {
    const response = await apiClient.patch<ApiResponse<Product>>(`/products/${productId}`, input);
    return response.data.data;
  },

  async adjustStock(productId: string, input: AdjustStockInput): Promise<Product> {
    const response = await apiClient.patch<ApiResponse<Product>>(`/products/${productId}/stock`, input);
    return response.data.data;
  },
};
