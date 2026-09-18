import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader } from '@/components/common/Surfaces';
import CustomerForm from '@/components/customers/CustomerForm';
import { CustomerService } from '@/services/customer.service';
import type { CustomerRequest } from '@/models/customer';
import { useToast } from '@/context/ToastContext';
import { AppError } from '@/services/api';

export default function AddCustomer() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(values: CustomerRequest) {
    setSubmitting(true);
    try {
      const created = await CustomerService.create(values);
      showToast('Customer added successfully.', 'success');
      navigate(`/customers/${created.id}`);
    } catch (err) {
      showToast(err instanceof AppError ? err.message : 'Unable to add customer.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Add Customer</h1>
        <p className="mt-1 text-sm text-slate-500">Create a new customer record.</p>
      </div>
      <Card>
        <CardHeader title="Customer Information" />
        <div className="p-5">
          <CustomerForm
            submitting={submitting}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/customers')}
          />
        </div>
      </Card>
    </div>
  );
}
