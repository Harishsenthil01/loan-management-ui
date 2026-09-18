import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, LoadingSpinner, ErrorState } from '@/components/common/Surfaces';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import { LoanApplicationService } from '@/services/loan-application.service';
import { LoanDetailsService } from '@/services/loan-details.service';
import type { LoanApplication, LoanDetailsRequest, EmploymentType, CollateralType } from '@/models/loan';
import { useForm } from '@/utils/useForm';
import { isRequired, isPositiveNumber, inRange } from '@/utils/validators';
import { useToast } from '@/context/ToastContext';
import { formatCurrency, titleCase } from '@/utils/formatters';
import { AppError } from '@/services/api';

const EMPLOYMENT_OPTIONS: { value: EmploymentType; label: string }[] = [
  { value: 'SALARIED', label: 'Salaried' },
  { value: 'SELF_EMPLOYED', label: 'Self Employed' },
  { value: 'BUSINESS_OWNER', label: 'Business Owner' },
  { value: 'UNEMPLOYED', label: 'Unemployed' },
];

const COLLATERAL_OPTIONS: { value: CollateralType; label: string }[] = [
  { value: 'NONE', label: 'None' },
  { value: 'PROPERTY', label: 'Property' },
  { value: 'VEHICLE', label: 'Vehicle' },
  { value: 'GOLD', label: 'Gold' },
  { value: 'FIXED_DEPOSIT', label: 'Fixed Deposit' },
  { value: 'OTHER', label: 'Other' },
];

interface FormValues extends Record<string, unknown> {
  purpose: string;
  employmentType: EmploymentType | '';
  employerName: string;
  monthlyIncome: number | '';
  monthlyExpenses: number | '';
  existingLoanAmount: number | '';
  existingEmi: number | '';
  creditScore: number | '';
  collateralType: CollateralType | '';
  collateralValue: number | '';
}

const EMPTY: FormValues = {
  purpose: '',
  employmentType: '',
  employerName: '',
  monthlyIncome: '',
  monthlyExpenses: '',
  existingLoanAmount: 0,
  existingEmi: 0,
  creditScore: '',
  collateralType: 'NONE',
  collateralValue: 0,
};

export default function LoanDetailsForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [application, setApplication] = useState<LoanApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { values, errors, handleChange, handleBlur, validateAll, setValues } = useForm<FormValues>(EMPTY, {
    purpose: (v) => isRequired(v),
    employmentType: (v) => isRequired(v),
    employerName: (v, all) =>
      all.employmentType && all.employmentType !== 'UNEMPLOYED' ? isRequired(v) : undefined,
    monthlyIncome: (v) => isRequired(v) ?? isPositiveNumber(v as number),
    monthlyExpenses: (v) => (v === '' ? 'This field is required.' : undefined),
    creditScore: (v) => isRequired(v) ?? inRange(300, 900)(v as number),
    collateralType: (v) => isRequired(v),
  });

  async function load() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const app = await LoanApplicationService.getById(Number(id));
      setApplication(app);
      const details = await LoanDetailsService.getByLoanApplicationId(Number(id));
      if (details) {
        setValues({
          purpose: details.purpose,
          employmentType: details.employmentType,
          employerName: details.employerName,
          monthlyIncome: details.monthlyIncome,
          monthlyExpenses: details.monthlyExpenses,
          existingLoanAmount: details.existingLoanAmount,
          existingEmi: details.existingEmi,
          creditScore: details.creditScore,
          collateralType: details.collateralType,
          collateralValue: details.collateralValue,
        });
      }
    } catch (err) {
      setError(err instanceof AppError ? err.message : 'Unable to load loan details.');
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
      const payload: LoanDetailsRequest = {
        loanApplicationId: Number(id),
        purpose: values.purpose,
        employmentType: values.employmentType as EmploymentType,
        employerName: values.employerName,
        monthlyIncome: Number(values.monthlyIncome),
        monthlyExpenses: Number(values.monthlyExpenses),
        existingLoanAmount: Number(values.existingLoanAmount) || 0,
        existingEmi: Number(values.existingEmi) || 0,
        creditScore: Number(values.creditScore),
        collateralType: values.collateralType as CollateralType,
        collateralValue: Number(values.collateralValue) || 0,
      };
      await LoanDetailsService.save(Number(id), payload);
      showToast('Loan details saved.', 'success');
      navigate(`/loans/${id}`);
    } catch (err) {
      showToast(err instanceof AppError ? err.message : 'Unable to save loan details.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner label="Loading loan details…" />;
  if (error || !application) return <ErrorState message={error ?? 'Application not found.'} onRetry={load} />;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Loan Details — Application #{application.id}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {application.customer?.name ?? `Customer #${application.customerId}`} ·{' '}
          {titleCase(application.loanType)} · {formatCurrency(application.loanAmount)}
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
        <Card>
          <CardHeader title="Loan Information" subtitle="Purpose of the loan." />
          <div className="p-5">
            <Input
              label="Purpose"
              value={values.purpose}
              onChange={handleChange('purpose')}
              onBlur={handleBlur('purpose')}
              error={errors.purpose}
              placeholder="e.g. Home renovation"
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Employment Information" />
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <Select
              label="Employment Type"
              value={values.employmentType}
              onChange={handleChange('employmentType')}
              onBlur={handleBlur('employmentType')}
              error={errors.employmentType}
              options={EMPLOYMENT_OPTIONS}
            />
            <Input
              label="Employer Name"
              value={values.employerName}
              onChange={handleChange('employerName')}
              onBlur={handleBlur('employerName')}
              error={errors.employerName}
              disabled={values.employmentType === 'UNEMPLOYED'}
            />
            <Input
              label="Monthly Income"
              type="number"
              value={values.monthlyIncome}
              onChange={handleChange('monthlyIncome')}
              onBlur={handleBlur('monthlyIncome')}
              error={errors.monthlyIncome}
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Financial Information" />
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <Input
              label="Monthly Expenses"
              type="number"
              value={values.monthlyExpenses}
              onChange={handleChange('monthlyExpenses')}
              onBlur={handleBlur('monthlyExpenses')}
              error={errors.monthlyExpenses}
            />
            <Input
              label="Existing Loan Amount"
              type="number"
              value={values.existingLoanAmount}
              onChange={handleChange('existingLoanAmount')}
            />
            <Input
              label="Existing EMI"
              type="number"
              value={values.existingEmi}
              onChange={handleChange('existingEmi')}
            />
            <Input
              label="Credit Score"
              type="number"
              min={300}
              max={900}
              value={values.creditScore}
              onChange={handleChange('creditScore')}
              onBlur={handleBlur('creditScore')}
              error={errors.creditScore}
              hint={!errors.creditScore ? 'Between 300 and 900.' : undefined}
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Collateral Information" />
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <Select
              label="Collateral Type"
              value={values.collateralType}
              onChange={handleChange('collateralType')}
              onBlur={handleBlur('collateralType')}
              error={errors.collateralType}
              options={COLLATERAL_OPTIONS}
            />
            <Input
              label="Collateral Value"
              type="number"
              disabled={values.collateralType === 'NONE'}
              value={values.collateralValue}
              onChange={handleChange('collateralValue')}
            />
          </div>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => navigate(`/loans/${id}`)} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            Save Loan Details
          </Button>
        </div>
      </form>
    </div>
  );
}
