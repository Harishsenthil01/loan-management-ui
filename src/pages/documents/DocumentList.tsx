import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, LoadingSpinner, EmptyState, ErrorState } from '@/components/common/Surfaces';
import Badge from '@/components/common/Badge';
import Select from '@/components/common/Select';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { Can } from '@/guards/Can';
import { LoanDocumentService } from '@/services/loan-document.service';
import type { DocumentStatus, LoanDocument } from '@/models/document';
import { formatDate, titleCase } from '@/utils/formatters';
import { useToast } from '@/context/ToastContext';
import { AppError } from '@/services/api';

const STATUS_OPTIONS: { value: DocumentStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'REJECTED', label: 'Rejected' },
];

export default function DocumentList() {
  const { showToast } = useToast();
  const [documents, setDocuments] = useState<LoanDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'ALL'>('ALL');
  const [pendingDelete, setPendingDelete] = useState<LoanDocument | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await LoanDocumentService.listAll();
      setDocuments(data);
    } catch (err) {
      setError(err instanceof AppError ? err.message : 'Unable to load documents.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (statusFilter === 'ALL') return documents;
    return documents.filter((d) => d.documentStatus === statusFilter);
  }, [documents, statusFilter]);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await LoanDocumentService.remove(pendingDelete.id);
      setDocuments((prev) => prev.filter((d) => d.id !== pendingDelete.id));
      showToast('Document deleted.', 'success');
    } catch (err) {
      showToast(err instanceof AppError ? err.message : 'Unable to delete document.', 'error');
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Documents</h1>
        <p className="mt-1 text-sm text-slate-500">All documents submitted across loan applications.</p>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <div className="w-56">
            <Select
              label=""
              className="!py-2"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as DocumentStatus | 'ALL')}
              options={STATUS_OPTIONS}
            />
          </div>
        </div>

        {loading ? (
          <LoadingSpinner label="Loading documents…" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No documents found"
            description="Documents uploaded against loan applications will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3">Document Type</th>
                  <th className="px-5 py-3">Document Name</th>
                  <th className="px-5 py-3">Document Number</th>
                  <th className="px-5 py-3">Uploaded Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Remarks</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-slate-600">{titleCase(doc.documentType)}</td>
                    <td className="px-5 py-3 font-medium text-slate-900">{doc.documentName}</td>
                    <td className="px-5 py-3 text-slate-600">{doc.documentNumber}</td>
                    <td className="px-5 py-3 text-slate-600">{formatDate(doc.uploadedDate)}</td>
                    <td className="px-5 py-3">
                      <Badge status={doc.documentStatus} />
                    </td>
                    <td className="max-w-xs truncate px-5 py-3 text-slate-500">{doc.remarks || '—'}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-3 text-sm font-medium">
                        <Link
                          to={`/loans/${doc.loanApplicationId}#documents`}
                          className="text-navy-700 hover:underline"
                        >
                          View Loan
                        </Link>
                        <Can do="document:manage">
                          <button onClick={() => setPendingDelete(doc)} className="text-red-600 hover:underline">
                            Delete
                          </button>
                        </Can>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete document"
        description={`Are you sure you want to delete "${pendingDelete?.documentName}"? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
