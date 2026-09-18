import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, LoadingSpinner, ErrorState } from '@/components/common/Surfaces';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Badge from '@/components/common/Badge';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { Can } from '@/guards/Can';
import { LoanDocumentService } from '@/services/loan-document.service';
import type { LoanDocument } from '@/models/document';
import { formatDate, titleCase } from '@/utils/formatters';
import { useToast } from '@/context/ToastContext';
import { AppError } from '@/services/api';

export default function DocumentDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [doc, setDoc] = useState<LoanDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  async function load() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await LoanDocumentService.getById(Number(id));
      setDoc(data);
      setRemarks(data.remarks);
    } catch (err) {
      setError(err instanceof AppError ? err.message : 'Unable to load document.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function saveRemarks() {
    if (!doc) return;
    setSaving(true);
    try {
      const updated = await LoanDocumentService.update(doc.id, { remarks });
      setDoc(updated);
      setEditing(false);
      showToast('Document updated.', 'success');
    } catch (err) {
      showToast(err instanceof AppError ? err.message : 'Unable to update document.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(status: 'VERIFIED' | 'REJECTED') {
    if (!doc) return;
    setUpdatingStatus(true);
    try {
      const updated = await LoanDocumentService.updateStatus(doc.id, status);
      setDoc(updated);
      showToast(`Document marked as ${titleCase(status)}.`, 'success');
    } catch (err) {
      showToast(err instanceof AppError ? err.message : 'Unable to update status.', 'error');
    } finally {
      setUpdatingStatus(false);
    }
  }

  async function handleDelete() {
    if (!doc) return;
    setDeleting(true);
    try {
      await LoanDocumentService.remove(doc.id);
      showToast('Document deleted.', 'success');
      navigate(`/loans/${doc.loanApplicationId}#documents`);
    } catch (err) {
      showToast(err instanceof AppError ? err.message : 'Unable to delete document.', 'error');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  if (loading) return <LoadingSpinner label="Loading document…" />;
  if (error || !doc) return <ErrorState message={error ?? 'Document not found.'} onRetry={load} />;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <Link to={`/loans/${doc.loanApplicationId}#documents`} className="text-sm font-medium text-navy-700 hover:underline">
          ← Back to Loan Application #{doc.loanApplicationId}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">{doc.documentName}</h1>
      </div>

      <Card>
        <CardHeader title="Document Information" action={<Badge status={doc.documentStatus} />} />
        <dl className="grid grid-cols-1 gap-6 p-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Document Type</dt>
            <dd className="mt-1 text-sm text-slate-900">{titleCase(doc.documentType)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Document Number</dt>
            <dd className="mt-1 text-sm text-slate-900">{doc.documentNumber}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Uploaded Date</dt>
            <dd className="mt-1 text-sm text-slate-900">{formatDate(doc.uploadedDate)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Remarks</dt>
            {editing ? (
              <div className="mt-2 flex gap-2">
                <Input label="" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                <Button size="sm" onClick={saveRemarks} loading={saving}>
                  Save
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setEditing(false)} disabled={saving}>
                  Cancel
                </Button>
              </div>
            ) : (
              <dd className="mt-1 flex items-center gap-3 text-sm text-slate-900">
                {doc.remarks || '—'}
                <Can do="document:manage">
                  <button onClick={() => setEditing(true)} className="text-xs font-medium text-navy-700 hover:underline">
                    Edit
                  </button>
                </Can>
              </dd>
            )}
          </div>
        </dl>

        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 p-5">
          <Can do="document:manage">
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
            {doc.documentStatus !== 'REJECTED' && (
              <Button
                variant="secondary"
                onClick={() => setStatus('REJECTED')}
                loading={updatingStatus}
              >
                Reject
              </Button>
            )}
            {doc.documentStatus !== 'VERIFIED' && (
              <Button onClick={() => setStatus('VERIFIED')} loading={updatingStatus}>
                Verify
              </Button>
            )}
          </Can>
        </div>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete document"
        description={`Are you sure you want to delete "${doc.documentName}"? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
