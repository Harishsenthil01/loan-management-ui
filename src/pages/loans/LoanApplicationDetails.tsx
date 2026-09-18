import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, LoadingSpinner, ErrorState } from '@/components/common/Surfaces';
import Button from '@/components/common/Button';
import Badge from '@/components/common/Badge';
import Select from '@/components/common/Select';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import DocumentsPanel from '@/components/documents/DocumentsPanel';
import { Can } from '@/guards/Can';
import { LoanApplicationService } from '@/services/loan-application.service';
import { LoanDetailsService } from '@/services/loan-details.service';
import { LoanDocumentService } from '@/services/loan-document.service';
import type { LoanApplication, LoanDetails, LoanStatus } from '@/models/loan';
import type { LoanDocument } from '@/models/document';
import { formatCurrency, formatDate, titleCase } from '@/utils/formatters';
import { useToast } from '@/context/ToastContext';
import { AppError } from '@/services/api';

const STATUS_OPTIONS: { value: LoanStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

export default function LoanApplicationDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [application, setApplication] = useState<LoanApplication | null>(null);
  const [details, setDetails] = useState<LoanDetails | null>(null);
  const [documents, setDocuments] = useState<LoanDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [pendingDocDelete, setPendingDocDelete] = useState<LoanDocument | null>(null);
  const [deletingDoc, setDeletingDoc] = useState(false);

  async function load() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const app = await LoanApplicationService.getById(Number(id));
      setApplication(app);
      const [detailsData, docsData] = await Promise.all([
        LoanDetailsService.getByLoanApplicationId(Number(id)).catch(() => null),
        LoanDocumentService.listByLoanApplication(Number(id)).catch(() => []),
      ]);
      setDetails(detailsData);
      setDocuments(docsData);
    } catch (err) {
      setError(err instanceof AppError ? err.message : 'Unable to load loan application.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // Scroll to documents section if URL has #documents
    if (window.location.hash === '#documents') {
      setTimeout(() => document.getElementById('documents')?.scrollIntoView({ behavior: 'smooth' }), 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleStatusChange(status: LoanStatus) {
    if (!application) return;
    setUpdatingStatus(true);
    try {
      const updated = await LoanApplicationService.updateStatus(application.id, status);
      setApplication(updated);
      showToast(`Status updated to ${titleCase(status)}.`, 'success');
    } catch (err) {
      showToast(err instanceof AppError ? err.message : 'Unable to update status.', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleDelete() {
    if (!application) return;
    setDeleting(true);
    try {
      await LoanApplicationService.remove(application.id);
      showToast('Loan application deleted.', 'success');
      navigate('/loans');
    } catch (err) {
      showToast(err instanceof AppError ? err.message : 'Unable to delete application.', 'error');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  async function handleDeleteDocument() {
    if (!pendingDocDelete) return;
    setDeletingDoc(true);
    try {
      await LoanDocumentService.remove(pendingDocDelete.id);
      setDocuments((prev) => prev.filter((d) => d.id !== pendingDocDelete.id));
      showToast('Document deleted.', 'success');
    } catch (err) {
      showToast(err instanceof AppError ? err.message : 'Unable to delete document.', 'error');
    } finally {
      setDeletingDoc(false);
      setPendingDocDelete(null);
    }
  }

  if (loading) return <LoadingSpinner label="Loading loan application…" />;
  if (error || !application) return <ErrorState message={error ?? 'Loan application not found.'} onRetry={load} />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/loans" className="text-sm font-medium text-navy-700 hover:underline">
            ← Back to Loan Applications
          </Link>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-slate-900">Loan Application #{application.id}</h1>
            <Badge status={application.status} />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          {application.customerId && (
            <Button variant="secondary" onClick={() => navigate(`/customers/${application.customerId}`)}>
              View Customer
            </Button>
          )}
          <Can do="document:upload">
            <Button variant="secondary" onClick={() => navigate(`/loans/${application.id}/documents/upload`)}>
              Add Document
            </Button>
          </Can>
          <Can do="loan:manage">
            <Button variant="secondary" onClick={() => navigate(`/loans/${application.id}/edit`)}>
              Edit
            </Button>
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
          </Can>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Customer Information"
            action={
              <Link to={`/customers/${application.customerId}`} className="text-sm font-medium text-navy-700 hover:underline">
                View Full Profile
              </Link>
            }
          />
          <dl className="grid grid-cols-1 gap-6 p-5 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Name</dt>
              <dd className="mt-1 text-sm text-slate-900">{application.customer?.name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Email</dt>
              <dd className="mt-1 text-sm text-slate-900">{application.customer?.email ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Mobile</dt>
              <dd className="mt-1 text-sm text-slate-900">{application.customer?.mobile ?? '—'}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <CardHeader title="Update Status" />
          <div className="flex flex-col gap-3 p-5">
            <Can do="loan:update-status">
              <Select
                label="Loan Status"
                value={application.status}
                onChange={(e) => handleStatusChange(e.target.value as LoanStatus)}
                options={STATUS_OPTIONS}
                disabled={updatingStatus}
              />
            </Can>
            {!updatingStatus && (
              <p className="text-xs text-slate-400">Applied on {formatDate(application.applicationDate)}</p>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Loan Information" />
        <dl className="grid grid-cols-2 gap-6 p-5 sm:grid-cols-4">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Loan Type</dt>
            <dd className="mt-1 text-sm text-slate-900">{titleCase(application.loanType)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Loan Amount</dt>
            <dd className="mt-1 text-sm text-slate-900">{formatCurrency(application.loanAmount)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Tenure</dt>
            <dd className="mt-1 text-sm text-slate-900">{application.tenureMonths} months</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Interest Rate</dt>
            <dd className="mt-1 text-sm text-slate-900">{application.interestRate}%</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <CardHeader
          title="Loan Details"
          subtitle="Employment, financial, and collateral information."
          action={
            <Link
              to={`/loans/${application.id}/loan-details`}
              className="text-sm font-medium text-navy-700 hover:underline"
            >
              {details ? 'Edit Details' : 'Add Details'}
            </Link>
          }
        />
        {!details ? (
          <div className="p-5 text-sm text-slate-500">No loan details recorded yet for this application.</div>
        ) : (
          <dl className="grid grid-cols-2 gap-6 p-5 sm:grid-cols-4">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Purpose</dt>
              <dd className="mt-1 text-sm text-slate-900">{details.purpose}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Employment</dt>
              <dd className="mt-1 text-sm text-slate-900">{titleCase(details.employmentType)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Monthly Income</dt>
              <dd className="mt-1 text-sm text-slate-900">{formatCurrency(details.monthlyIncome)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Monthly Expenses</dt>
              <dd className="mt-1 text-sm text-slate-900">{formatCurrency(details.monthlyExpenses)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Existing Loan</dt>
              <dd className="mt-1 text-sm text-slate-900">{formatCurrency(details.existingLoanAmount)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Credit Score</dt>
              <dd className="mt-1 text-sm text-slate-900">{details.creditScore}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Collateral</dt>
              <dd className="mt-1 text-sm text-slate-900">
                {titleCase(details.collateralType)}
                {details.collateralType !== 'NONE' ? ` — ${formatCurrency(details.collateralValue)}` : ''}
              </dd>
            </div>
          </dl>
        )}
      </Card>

      <Card>
        <DocumentsPanel
          loanApplicationId={application.id}
          documents={documents}
          onDeleteRequest={setPendingDocDelete}
        />
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete loan application"
        description={`Are you sure you want to delete application #${application.id}? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
      <ConfirmDialog
        open={!!pendingDocDelete}
        title="Delete document"
        description={`Are you sure you want to delete "${pendingDocDelete?.documentName}"?`}
        confirmLabel="Delete"
        loading={deletingDoc}
        onConfirm={handleDeleteDocument}
        onCancel={() => setPendingDocDelete(null)}
      />
    </div>
  );
}
