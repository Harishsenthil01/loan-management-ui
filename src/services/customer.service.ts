import { apiClient } from './api';
import type { Customer, CustomerRequest } from '@/models/customer';

export interface CustomerQuery {
  search?: string;
  page?: number;
  size?: number;
}

export const CustomerService = {
  async list(query: CustomerQuery = {}): Promise<Customer[]> {
    const { data } = await apiClient.get<Customer[]>('/customers', { params: query });
    return data;
  },

  async getById(id: number): Promise<Customer> {
    const { data } = await apiClient.get<Customer>(`/customers/${id}`);
    return data;
  },

  async create(payload: CustomerRequest): Promise<Customer> {
    const { data } = await apiClient.post<Customer>('/customers', payload);
    return data;
  },

  async update(id: number, payload: CustomerRequest): Promise<Customer> {
    const { data } = await apiClient.put<Customer>(`/customers/${id}`, payload);
    return data;
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`/customers/${id}`);
  },
};
