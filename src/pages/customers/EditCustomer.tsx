import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, LoadingSpinner, ErrorState } from '@/components/common/Surfaces';
import CustomerForm from '@/components/customers/CustomerForm';
import { CustomerService } from '@/services/customer.service';
import type { Customer, CustomerRequest } from '@/models/customer';
import { useToast } from '@/context/ToastContext';
import { AppError } from '@/services/api';

export default function EditCustomer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await CustomerService.getById(Number(id));
      setCustomer(data);
    } catch (err) {
      setError(err instanceof AppError ? err.message : 'Unable to load customer.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSubmit(values: CustomerRequest) {
    if (!id) return;
    setSubmitting(true);
    try {
      await CustomerService.update(Number(id), values);
      showToast('Customer updated successfully.', 'success');
      navigate(`/customers/${id}`);
    } catch (err) {
      showToast(err instanceof AppError ? err.message : 'Unable to update customer.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Edit Customer</h1>
        <p className="mt-1 text-sm text-slate-500">Update customer details.</p>
      </div>
      <Card>
        <CardHeader title="Customer Information" />
        <div className="p-5">
          {loading ? (
            <LoadingSpinner />
          ) : error || !customer ? (
            <ErrorState message={error ?? 'Customer not found.'} onRetry={load} />
          ) : (
            <CustomerForm
              initialValues={{
                name: customer.name,
                email: customer.email,
                mobile: customer.mobile,
                address: customer.address,
              }}
              submitLabel="Update Customer"
              submitting={submitting}
              onSubmit={handleSubmit}
              onCancel={() => navigate(`/customers/${id}`)}
            />
          )}
        </div>
      </Card>
    </div>
  );
}
