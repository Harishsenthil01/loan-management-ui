export interface ApiErrorResponse {
  status?: number;
  message?: string;
  errors?: Record<string, string>;
  timestamp?: string;
  path?: string;
}

export interface DashboardSummary {
  totalCustomers: number;
  totalApplications: number;
  pendingApplications: number;
  approvedLoans: number;
  rejectedLoans: number;
  totalLoanAmount: number;
  applicationsByStatus: { status: string; count: number }[];
  amountByLoanType: { loanType: string; amount: number }[];
  monthlyApplications: { month: string; count: number }[];
}
