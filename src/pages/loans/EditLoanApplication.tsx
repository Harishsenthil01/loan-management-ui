import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, LoadingSpinner, ErrorState } from '@/components/common/Surfaces';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import { LoanApplicationService } from '@/services/loan-application.service';
import type { LoanApplication, LoanApplicationRequest, LoanType, LoanStatus } from '@/models/loan';
import { useForm } from '@/utils/useForm';
import { isRequired, isPositiveNumber, inRange } from '@/utils/validators';
import { useToast } from '@/context/ToastContext';
import { Can } from '@/guards/Can';
import { AppError } from '@/services/api';

const LOAN_TYPE_OPTIONS: { value: LoanType; label: string }[] = [
  { value: 'PERSONAL', label: 'Personal Loan' },
  { value: 'HOME', label: 'Home Loan' },
  { value: 'AUTO', label: 'Auto Loan' },
  { value: 'EDUCATION', label: 'Education Loan' },
  { value: 'BUSINESS', label: 'Business Loan' },
  { value: 'GOLD', label: 'Gold Loan' },
];

const STATUS_OPTIONS: { value: LoanStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

interface FormValues extends Record<string, unknown> {
  loanType: LoanType | '';
  loanAmount: number | '';
  tenureMonths: number | '';
  interestRate: number | '';
  status: LoanStatus | '';
}

export default function EditLoanApplication() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [application, setApplication] = useState<LoanApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { values, errors, handleChange, handleBlur, validateAll, setValues } = useForm<FormValues>(
    { loanType: '', loanAmount: '', tenureMonths: '', interestRate: '', status: '' },
    {
      loanType: (v) => isRequired(v),
      loanAmount: (v) => isRequired(v) ?? isPositiveNumber(v as number),
      tenureMonths: (v) => isRequired(v) ?? inRange(1, 480)(v as number),
      interestRate: (v) => isRequired(v) ?? inRange(0.1, 50)(v as number),
      status: (v) => isRequired(v),
    },
  );

  async function load() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await LoanApplicationService.getById(Number(id));
      setApplication(data);
      setValues({
        loanType: data.loanType,
        loanAmount: data.loanAmount,
        tenureMonths: data.tenureMonths,
        interestRate: data.interestRate,
        status: data.status,
      });
    } catch (err) {
      setError(err instanceof AppError ? err.message : 'Unable to load loan application.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !validateAll()) return;
    setSubmitting(true);
    try {
      const payload: LoanApplicationRequest = {
        customerId: application!.customerId,
        loanType: values.loanType as LoanType,
        loanAmount: values.loanAmount as number,
        tenureMonths: values.tenureMonths as number,
        interestRate: values.interestRate as number,
        status: values.status as LoanStatus,
      };
      await LoanApplicationService.update(Number(id), payload);
      showToast('Loan application updated.', 'success');
      navigate(`/loans/${id}`);
    } catch (err) {
      showToast(err instanceof AppError ? err.message : 'Unable to update loan application.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner label="Loading application…" />;
  if (error || !application) return <ErrorState message={error ?? 'Application not found.'} onRetry={load} />;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Edit Loan Application #{application.id}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Customer: {application.customer?.name ?? `#${application.customerId}`}
        </p>
      </div>
      <Card>
        <CardHeader title="Loan Information" />
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 p-5">
          <Select
            label="Loan Type"
            value={values.loanType}
            onChange={handleChange('loanType')}
            onBlur={handleBlur('loanType')}
            error={errors.loanType}
            options={LOAN_TYPE_OPTIONS}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Loan Amount"
              type="number"
              value={values.loanAmount}
              onChange={handleChange('loanAmount')}
              onBlur={handleBlur('loanAmount')}
              error={errors.loanAmount}
            />
            <Input
              label="Tenure (months)"
              type="number"
              value={values.tenureMonths}
              onChange={handleChange('tenureMonths')}
              onBlur={handleBlur('tenureMonths')}
              error={errors.tenureMonths}
            />
          </div>
          <Input
            label="Interest Rate (%)"
            type="number"
            step="0.1"
            value={values.interestRate}
            onChange={handleChange('interestRate')}
            onBlur={handleBlur('interestRate')}
            error={errors.interestRate}
          />
          <Can do="loan:update-status">
            <Select
              label="Status"
              value={values.status}
              onChange={handleChange('status')}
              onBlur={handleBlur('status')}
              error={errors.status}
              options={STATUS_OPTIONS}
            />
          </Can>

          <div className="mt-2 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={() => navigate(`/loans/${id}`)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
