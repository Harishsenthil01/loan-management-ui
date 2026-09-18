import { apiClient } from './api';
import type { LoanApplication, LoanApplicationRequest, LoanStatus } from '@/models/loan';

export interface LoanApplicationQuery {
  customerId?: number;
  status?: LoanStatus;
  search?: string;
  page?: number;
  size?: number;
}

export const LoanApplicationService = {
  async list(query: LoanApplicationQuery = {}): Promise<LoanApplication[]> {
    const { data } = await apiClient.get<LoanApplication[]>('/loan-applications', { params: query });
    return data;
  },

  async getById(id: number): Promise<LoanApplication> {
    const { data } = await apiClient.get<LoanApplication>(`/loan-applications/${id}`);
    return data;
  },

  async listByCustomer(customerId: number): Promise<LoanApplication[]> {
    const { data } = await apiClient.get<LoanApplication[]>(`/customers/${customerId}/loan-applications`);
    return data;
  },

  async create(payload: LoanApplicationRequest): Promise<LoanApplication> {
    const { data } = await apiClient.post<LoanApplication>('/loan-applications', payload);
    return data;
  },

  async update(id: number, payload: LoanApplicationRequest): Promise<LoanApplication> {
    const { data } = await apiClient.put<LoanApplication>(`/loan-applications/${id}`, payload);
    return data;
  },

  async updateStatus(id: number, status: LoanStatus): Promise<LoanApplication> {
    const { data } = await apiClient.patch<LoanApplication>(`/loan-applications/${id}/status`, { status });
    return data;
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`/loan-applications/${id}`);
  },
};
