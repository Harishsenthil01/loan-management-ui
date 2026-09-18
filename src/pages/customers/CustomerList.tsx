import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/common/Surfaces';
import { LoadingSpinner, EmptyState, ErrorState } from '@/components/common/Surfaces';
import Button from '@/components/common/Button';
import Pagination from '@/components/common/Pagination';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { Can } from '@/guards/Can';
import { CustomerService } from '@/services/customer.service';
import type { Customer } from '@/models/customer';
import { useToast } from '@/context/ToastContext';
import { AppError } from '@/services/api';

const PAGE_SIZE = 8;

export default function CustomerList() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await CustomerService.list();
      setCustomers(data);
    } catch (err) {
      setError(err instanceof AppError ? err.message : 'Unable to load customers.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.mobile.includes(q),
    );
  }, [customers, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await CustomerService.remove(pendingDelete.id);
      setCustomers((prev) => prev.filter((c) => c.id !== pendingDelete.id));
      showToast('Customer deleted.', 'success');
    } catch (err) {
      showToast(err instanceof AppError ? err.message : 'Unable to delete customer.', 'error');
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Customers</h1>
          <p className="mt-1 text-sm text-slate-500">Manage customer records and their loan history.</p>
        </div>
        <Can do="customer:manage">
          <Button onClick={() => navigate('/customers/new')}>+ Add Customer</Button>
        </Can>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search by name, email, or mobile…"
            className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
          />
        </div>

        {loading ? (
          <LoadingSpinner label="Loading customers…" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No customers found"
            description={search ? 'Try a different search term.' : 'Add your first customer to get started.'}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <th className="px-5 py-3">ID</th>
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Mobile</th>
                    <th className="px-5 py-3">Address</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paged.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 text-slate-500">#{c.id}</td>
                      <td className="px-5 py-3 font-medium text-slate-900">{c.name}</td>
                      <td className="px-5 py-3 text-slate-600">{c.email}</td>
                      <td className="px-5 py-3 text-slate-600">{c.mobile}</td>
                      <td className="max-w-xs truncate px-5 py-3 text-slate-600">{c.address}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-3 text-sm font-medium">
                          <Link to={`/customers/${c.id}`} className="text-navy-700 hover:underline">
                            View
                          </Link>
                          <Can do="customer:manage">
                            <Link to={`/customers/${c.id}/edit`} className="text-slate-600 hover:underline">
                              Edit
                            </Link>
                            <button
                              onClick={() => setPendingDelete(c)}
                              className="text-red-600 hover:underline"
                            >
                              Delete
                            </button>
                          </Can>
                          <Can do="loan:create-own">
                            <Link
                              to={`/loans/new?customerId=${c.id}`}
                              className="text-slate-600 hover:underline"
                            >
                              Create Loan
                            </Link>
                          </Can>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </Card>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete customer"
        description={`Are you sure you want to delete ${pendingDelete?.name}? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
