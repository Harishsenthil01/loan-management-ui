import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card, CardHeader, LoadingSpinner } from '@/components/common/Surfaces';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import { LoanApplicationService } from '@/services/loan-application.service';
import { LoanDocumentService } from '@/services/loan-document.service';
import type { DocumentType } from '@/models/document';
import type { LoanApplication } from '@/models/loan';
import { useForm } from '@/utils/useForm';
import { isRequired } from '@/utils/validators';
import { useToast } from '@/context/ToastContext';
import { AppError } from '@/services/api';

const DOCUMENT_TYPE_OPTIONS: { value: DocumentType; label: string }[] = [
  { value: 'ID_PROOF', label: 'ID Proof' },
  { value: 'ADDRESS_PROOF', label: 'Address Proof' },
  { value: 'INCOME_PROOF', label: 'Income Proof' },
  { value: 'BANK_STATEMENT', label: 'Bank Statement' },
  { value: 'PROPERTY_PAPERS', label: 'Property Papers' },
  { value: 'PHOTOGRAPH', label: 'Photograph' },
  { value: 'OTHER', label: 'Other' },
];

interface FormValues extends Record<string, unknown> {
  documentType: DocumentType | '';
  documentName: string;
  documentNumber: string;
  remarks: string;
}

export default function UploadDocument() {
  const { id: loanIdParam } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const loanApplicationId = Number(loanIdParam ?? searchParams.get('loanApplicationId'));
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [application, setApplication] = useState<LoanApplication | null>(null);
  const [loadingApp, setLoadingApp] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { values, errors, handleChange, handleBlur, validateAll } = useForm<FormValues>(
    { documentType: '', documentName: '', documentNumber: '', remarks: '' },
    {
      documentType: (v) => isRequired(v),
      documentName: (v) => isRequired(v),
      documentNumber: (v) => isRequired(v),
    },
  );

  useEffect(() => {
    async function load() {
      if (!loanApplicationId) return;
      setLoadingApp(true);
      try {
        const app = await LoanApplicationService.getById(loanApplicationId);
        setApplication(app);
      } catch {
        showToast('Unable to load loan application.', 'error');
      } finally {
        setLoadingApp(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loanApplicationId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFileError(null);
    const formValid = validateAll();
    if (!file) setFileError('Please select a file to upload.');
    if (!formValid || !file) return;

    setUploading(true);
    setProgress(0);
    try {
      await LoanDocumentService.upload(
        {
          loanApplicationId,
          documentType: values.documentType as DocumentType,
          documentName: values.documentName,
          documentNumber: values.documentNumber,
          remarks: values.remarks,
          file,
        },
        setProgress,
      );
      showToast('Document uploaded successfully.', 'success');
      navigate(`/loans/${loanApplicationId}#documents`);
    } catch (err) {
      showToast(err instanceof AppError ? err.message : 'Unable to upload document.', 'error');
    } finally {
      setUploading(false);
    }
  }

  if (loadingApp) return <LoadingSpinner label="Loading…" />;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Upload Document</h1>
        <p className="mt-1 text-sm text-slate-500">
          For loan application #{loanApplicationId}
          {application?.customer?.name ? ` — ${application.customer.name}` : ''}
        </p>
      </div>
      <Card>
        <CardHeader title="Document Information" />
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 p-5">
          <Select
            label="Document Type"
            placeholder="Select document type"
            value={values.documentType}
            onChange={handleChange('documentType')}
            onBlur={handleBlur('documentType')}
            error={errors.documentType}
            options={DOCUMENT_TYPE_OPTIONS}
          />
          <Input
            label="Document Name"
            value={values.documentName}
            onChange={handleChange('documentName')}
            onBlur={handleBlur('documentName')}
            error={errors.documentName}
            placeholder="e.g. Aadhaar Card"
          />
          <Input
            label="Document Number"
            value={values.documentNumber}
            onChange={handleChange('documentNumber')}
            onBlur={handleBlur('documentNumber')}
            error={errors.documentNumber}
            placeholder="e.g. XXXX-XXXX-1234"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">File</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={[
                'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors',
                fileError ? 'border-red-300 bg-red-50/30' : 'border-slate-300 hover:border-navy-400',
              ].join(' ')}
            >
              <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
              <p className="text-sm text-slate-600">{file ? file.name : 'Click to select a file, or drag and drop'}</p>
              <p className="text-xs text-slate-400">PDF, JPG, or PNG up to 10MB</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setFileError(null);
              }}
            />
            {fileError && <p className="text-xs font-medium text-red-600">{fileError}</p>}
          </div>

          <Input
            label="Remarks"
            value={values.remarks}
            onChange={handleChange('remarks')}
            placeholder="Optional notes"
          />

          {uploading && (
            <div>
              <div className="mb-1 flex justify-between text-xs font-medium text-slate-600">
                <span>Uploading…</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-navy-600 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <div className="mt-2 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(`/loans/${loanApplicationId}#documents`)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button type="submit" loading={uploading}>
              Upload Document
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
