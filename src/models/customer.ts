export interface Customer {
  id: number;
  name: string;
  email: string;
  mobile: string;
  address: string;
}

export type CustomerRequest = Omit<Customer, 'id'>;

export interface PagedResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}
