import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, LoadingSpinner, EmptyState, ErrorState } from '@/components/common/Surfaces';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import Select from '@/components/common/Select';
import Pagination from '@/components/common/Pagination';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { Can } from '@/guards/Can';
import { LoanApplicationService } from '@/services/loan-application.service';
import type { LoanApplication, LoanStatus } from '@/models/loan';
import { formatCurrency, formatDate, titleCase } from '@/utils/formatters';
import { useToast } from '@/context/ToastContext';
import { AppError } from '@/services/api';

const PAGE_SIZE = 8;

const STATUS_OPTIONS: { value: LoanStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

export default function LoanApplicationList() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LoanStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<LoanApplication | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await LoanApplicationService.list();
      setApplications(data);
    } catch (err) {
      setError(err instanceof AppError ? err.message : 'Unable to load loan applications.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = applications;
    if (statusFilter !== 'ALL') list = list.filter((a) => a.status === statusFilter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (a) =>
          String(a.id).includes(q) ||
          a.customer?.name?.toLowerCase().includes(q) ||
          a.loanType.toLowerCase().includes(q),
      );
    }
    return list;
  }, [applications, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await LoanApplicationService.remove(pendingDelete.id);
      setApplications((prev) => prev.filter((a) => a.id !== pendingDelete.id));
      showToast('Loan application deleted.', 'success');
    } catch (err) {
      showToast(err instanceof AppError ? err.message : 'Unable to delete application.', 'error');
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Loan Applications</h1>
          <p className="mt-1 text-sm text-slate-500">Track and manage all loan applications.</p>
        </div>
        <Can do="loan:create-own">
          <Button onClick={() => navigate('/loans/new')}>+ New Application</Button>
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
            placeholder="Search by ID, customer, or loan type…"
            className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
          />
          <div className="w-48">
            <Select
              label=""
              className="!py-2"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as LoanStatus | 'ALL');
                setPage(0);
              }}
              options={STATUS_OPTIONS}
            />
          </div>
        </div>

        {loading ? (
          <LoadingSpinner label="Loading applications…" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No loan applications found"
            description="Try adjusting your filters, or create a new application."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    <th className="px-5 py-3">App. ID</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Loan Type</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Tenure</th>
                    <th className="px-5 py-3">Interest</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paged.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-900">#{app.id}</td>
                      <td className="px-5 py-3 text-slate-600">
                        {app.customer?.name ?? `Customer #${app.customerId}`}
                      </td>
                      <td className="px-5 py-3 text-slate-600">{titleCase(app.loanType)}</td>
                      <td className="px-5 py-3 text-slate-600">{formatCurrency(app.loanAmount)}</td>
                      <td className="px-5 py-3 text-slate-600">{app.tenureMonths} mo</td>
                      <td className="px-5 py-3 text-slate-600">{app.interestRate}%</td>
                      <td className="px-5 py-3 text-slate-600">{formatDate(app.applicationDate)}</td>
                      <td className="px-5 py-3">
                        <Badge status={app.status} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-3 text-sm font-medium">
                          <Link to={`/loans/${app.id}`} className="text-navy-700 hover:underline">
                            View
                          </Link>
                          <Can do="loan:manage">
                            <Link to={`/loans/${app.id}/edit`} className="text-slate-600 hover:underline">
                              Edit
                            </Link>
                            <button onClick={() => setPendingDelete(app)} className="text-red-600 hover:underline">
                              Delete
                            </button>
                          </Can>
                          <Link to={`/loans/${app.id}#documents`} className="text-slate-600 hover:underline">
                            Documents
                          </Link>
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
        title="Delete loan application"
        description={`Are you sure you want to delete application #${pendingDelete?.id}? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
