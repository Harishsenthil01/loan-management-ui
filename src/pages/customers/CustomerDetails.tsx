import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, LoadingSpinner, ErrorState, EmptyState } from '@/components/common/Surfaces';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { Can } from '@/guards/Can';
import { CustomerService } from '@/services/customer.service';
import { LoanApplicationService } from '@/services/loan-application.service';
import type { Customer } from '@/models/customer';
import type { LoanApplication } from '@/models/loan';
import { formatCurrency, formatDate, titleCase } from '@/utils/formatters';
import { useToast } from '@/context/ToastContext';
import { AppError } from '@/services/api';

export default function CustomerDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [customerData, loanData] = await Promise.all([
        CustomerService.getById(Number(id)),
        LoanApplicationService.listByCustomer(Number(id)).catch(() => []),
      ]);
      setCustomer(customerData);
      setLoans(loanData);
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

  async function handleDelete() {
    if (!customer) return;
    setDeleting(true);
    try {
      await CustomerService.remove(customer.id);
      showToast('Customer deleted.', 'success');
      navigate('/customers');
    } catch (err) {
      showToast(err instanceof AppError ? err.message : 'Unable to delete customer.', 'error');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  if (loading) return <LoadingSpinner label="Loading customer…" />;
  if (error || !customer) return <ErrorState message={error ?? 'Customer not found.'} onRetry={load} />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/customers" className="text-sm font-medium text-navy-700 hover:underline">
            ← Back to Customers
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">{customer.name}</h1>
        </div>
        <div className="flex gap-3">
          <Can do="loan:create-own">
            <Button variant="secondary" onClick={() => navigate(`/loans/new?customerId=${customer.id}`)}>
              Create Loan
            </Button>
          </Can>
          <Can do="customer:manage">
            <Button variant="secondary" onClick={() => navigate(`/customers/${customer.id}/edit`)}>
              Edit
            </Button>
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
          </Can>
        </div>
      </div>

      <Card>
        <CardHeader title="Customer Information" />
        <dl className="grid grid-cols-1 gap-6 p-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Name</dt>
            <dd className="mt-1 text-sm text-slate-900">{customer.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Email</dt>
            <dd className="mt-1 text-sm text-slate-900">{customer.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Mobile</dt>
            <dd className="mt-1 text-sm text-slate-900">{customer.mobile}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Address</dt>
            <dd className="mt-1 text-sm text-slate-900">{customer.address}</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <CardHeader title="Loan Applications" subtitle={`${loans.length} application(s)`} />
        {loans.length === 0 ? (
          <EmptyState
            title="No loan applications"
            description="This customer hasn't applied for any loans yet."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3">Application ID</th>
                  <th className="px-5 py-3">Loan Type</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-900">#{loan.id}</td>
                    <td className="px-5 py-3 text-slate-600">{titleCase(loan.loanType)}</td>
                    <td className="px-5 py-3 text-slate-600">{formatCurrency(loan.loanAmount)}</td>
                    <td className="px-5 py-3 text-slate-600">{formatDate(loan.applicationDate)}</td>
                    <td className="px-5 py-3">
                      <Badge status={loan.status} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link to={`/loans/${loan.id}`} className="text-sm font-medium text-navy-700 hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete customer"
        description={`Are you sure you want to delete ${customer.name}? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
