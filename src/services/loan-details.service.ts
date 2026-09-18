import { apiClient } from './api';
import type { LoanDetails, LoanDetailsRequest } from '@/models/loan';

export const LoanDetailsService = {
  async getByLoanApplicationId(loanApplicationId: number): Promise<LoanDetails | null> {
    try {
      const { data } = await apiClient.get<LoanDetails>(
        `/loan-applications/${loanApplicationId}/loan-details`,
      );
      return data;
    } catch (err) {
      // No loan details recorded yet for this application is a valid state.
      if ((err as { status?: number }).status === 404) return null;
      throw err;
    }
  },

  async save(loanApplicationId: number, payload: LoanDetailsRequest): Promise<LoanDetails> {
    const { data } = await apiClient.put<LoanDetails>(
      `/loan-applications/${loanApplicationId}/loan-details`,
      payload,
    );
    return data;
  },
};
