export type DocumentType =
  | 'ID_PROOF'
  | 'ADDRESS_PROOF'
  | 'INCOME_PROOF'
  | 'BANK_STATEMENT'
  | 'PROPERTY_PAPERS'
  | 'PHOTOGRAPH'
  | 'OTHER';

export type DocumentStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface LoanDocument {
  id: number;
  loanApplicationId: number;
  documentType: DocumentType;
  documentName: string;
  documentNumber: string;
  documentStatus: DocumentStatus;
  uploadedDate: string;
  remarks: string;
  fileUrl?: string;
}

export interface LoanDocumentRequest {
  loanApplicationId: number;
  documentType: DocumentType;
  documentName: string;
  documentNumber: string;
  remarks: string;
  file?: File;
}
