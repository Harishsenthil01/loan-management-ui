import type { Customer } from './customer';

export type LoanStatus = 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';

export type LoanType =
  | 'PERSONAL'
  | 'HOME'
  | 'AUTO'
  | 'EDUCATION'
  | 'BUSINESS'
  | 'GOLD';

export interface LoanApplication {
  id: number;
  customerId: number;
  customer?: Customer;
  loanType: LoanType;
  loanAmount: number;
  tenureMonths: number;
  interestRate: number;
  applicationDate: string; // ISO date string
  status: LoanStatus;
}

export type LoanApplicationRequest = Omit<
  LoanApplication,
  'id' | 'customer' | 'applicationDate' | 'status'
> & { status?: LoanStatus };

export type EmploymentType = 'SALARIED' | 'SELF_EMPLOYED' | 'BUSINESS_OWNER' | 'UNEMPLOYED';

export type CollateralType = 'NONE' | 'PROPERTY' | 'VEHICLE' | 'GOLD' | 'FIXED_DEPOSIT' | 'OTHER';

export interface LoanDetails {
  id: number;
  loanApplicationId: number;
  purpose: string;
  employmentType: EmploymentType;
  employerName: string;
  monthlyIncome: number;
  monthlyExpenses: number;
  existingLoanAmount: number;
  existingEmi: number;
  creditScore: number;
  collateralType: CollateralType;
  collateralValue: number;
  createdDate: string;
}

export type LoanDetailsRequest = Omit<LoanDetails, 'id' | 'createdDate'>;
