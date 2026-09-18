import { apiClient } from './api';
import type { LoanDocument, LoanDocumentRequest, DocumentStatus } from '@/models/document';

export const LoanDocumentService = {
  async listAll(): Promise<LoanDocument[]> {
    const { data } = await apiClient.get<LoanDocument[]>('/documents');
    return data;
  },

  async listByLoanApplication(loanApplicationId: number): Promise<LoanDocument[]> {
    const { data } = await apiClient.get<LoanDocument[]>(
      `/loan-applications/${loanApplicationId}/documents`,
    );
    return data;
  },

  async getById(id: number): Promise<LoanDocument> {
    const { data } = await apiClient.get<LoanDocument>(`/documents/${id}`);
    return data;
  },

  async upload(
    payload: LoanDocumentRequest,
    onProgress?: (percent: number) => void,
  ): Promise<LoanDocument> {
    const form = new FormData();
    form.append('loanApplicationId', String(payload.loanApplicationId));
    form.append('documentType', payload.documentType);
    form.append('documentName', payload.documentName);
    form.append('documentNumber', payload.documentNumber);
    form.append('remarks', payload.remarks ?? '');
    if (payload.file) form.append('file', payload.file);

    const { data } = await apiClient.post<LoanDocument>('/documents', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => {
        if (onProgress && evt.total) {
          onProgress(Math.round((evt.loaded / evt.total) * 100));
        }
      },
    });
    return data;
  },

  async update(id: number, payload: Partial<LoanDocumentRequest>): Promise<LoanDocument> {
    const { data } = await apiClient.put<LoanDocument>(`/documents/${id}`, payload);
    return data;
  },

  async updateStatus(id: number, status: DocumentStatus): Promise<LoanDocument> {
    const { data } = await apiClient.patch<LoanDocument>(`/documents/${id}/status`, { status });
    return data;
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`/documents/${id}`);
  },
};
