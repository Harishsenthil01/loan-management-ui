import { Link } from 'react-router-dom';
import { CardHeader, EmptyState } from '@/components/common/Surfaces';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import { Can } from '@/guards/Can';
import type { LoanDocument } from '@/models/document';
import { formatDate, titleCase } from '@/utils/formatters';

interface DocumentsPanelProps {
  loanApplicationId: number;
  documents: LoanDocument[];
  onDeleteRequest: (doc: LoanDocument) => void;
}

export default function DocumentsPanel({ loanApplicationId, documents, onDeleteRequest }: DocumentsPanelProps) {
  return (
    <div id="documents">
      <CardHeader
        title="Documents"
        subtitle={`${documents.length} document(s) submitted`}
        action={
          <Can do="document:upload">
            <Link to={`/loans/${loanApplicationId}/documents/upload`}>
              <Button size="sm">+ Upload Document</Button>
            </Link>
          </Can>
        }
      />
      {documents.length === 0 ? (
        <EmptyState title="No documents yet" description="Upload identity, income, or collateral documents." />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Number</th>
                <th className="px-5 py-3">Uploaded</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 text-slate-600">{titleCase(doc.documentType)}</td>
                  <td className="px-5 py-3 font-medium text-slate-900">{doc.documentName}</td>
                  <td className="px-5 py-3 text-slate-600">{doc.documentNumber}</td>
                  <td className="px-5 py-3 text-slate-600">{formatDate(doc.uploadedDate)}</td>
                  <td className="px-5 py-3">
                    <Badge status={doc.documentStatus} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-3 text-sm font-medium">
                      <Link to={`/documents/${doc.id}`} className="text-navy-700 hover:underline">
                        View
                      </Link>
                      <Can do="document:manage">
                        <button onClick={() => onDeleteRequest(doc)} className="text-red-600 hover:underline">
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
    </div>
  );
}
