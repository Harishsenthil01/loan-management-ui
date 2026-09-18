import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardHeader, LoadingSpinner } from '@/components/common/Surfaces';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import Stepper from '@/components/common/Stepper';
import { CustomerService } from '@/services/customer.service';
import { LoanApplicationService } from '@/services/loan-application.service';
import type { Customer } from '@/models/customer';
import type { LoanApplicationRequest, LoanType } from '@/models/loan';
import { useForm } from '@/utils/useForm';
import { isRequired, isPositiveNumber, inRange } from '@/utils/validators';
import { formatCurrency, titleCase } from '@/utils/formatters';
import { useToast } from '@/context/ToastContext';
import { AppError } from '@/services/api';

const STEPS = ['Customer', 'Loan Information', 'Review'];

const LOAN_TYPE_OPTIONS: { value: LoanType; label: string }[] = [
  { value: 'PERSONAL', label: 'Personal Loan' },
  { value: 'HOME', label: 'Home Loan' },
  { value: 'AUTO', label: 'Auto Loan' },
  { value: 'EDUCATION', label: 'Education Loan' },
  { value: 'BUSINESS', label: 'Business Loan' },
  { value: 'GOLD', label: 'Gold Loan' },
];

interface LoanFormValues extends Record<string, unknown> {
  customerId: number | '';
  loanType: LoanType | '';
  loanAmount: number | '';
  tenureMonths: number | '';
  interestRate: number | '';
}

export default function CreateLoanApplication() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const [step, setStep] = useState(0);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { values, errors, handleChange, handleBlur, validateAll, setValue } = useForm<LoanFormValues>(
    {
      customerId: searchParams.get('customerId') ? Number(searchParams.get('customerId')) : '',
      loanType: '',
      loanAmount: '',
      tenureMonths: '',
      interestRate: '',
    },
    {
      customerId: (v) => isRequired(v),
      loanType: (v) => isRequired(v),
      loanAmount: (v) => isRequired(v) ?? isPositiveNumber(v as number),
      tenureMonths: (v) => isRequired(v) ?? inRange(1, 480)(v as number),
      interestRate: (v) => isRequired(v) ?? inRange(0.1, 50)(v as number),
    },
  );

  useEffect(() => {
    async function loadCustomers() {
      setLoadingCustomers(true);
      try {
        const data = await CustomerService.list();
        setCustomers(data);
      } catch {
        showToast('Unable to load customers.', 'error');
      } finally {
        setLoadingCustomers(false);
      }
    }
    loadCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedCustomer = customers.find((c) => c.id === values.customerId);

  function validateStep(): boolean {
    if (step === 0) return !isRequired(values.customerId);
    if (step === 1) {
      return (
        !isRequired(values.loanType) &&
        !isPositiveNumber(values.loanAmount as number) &&
        !inRange(1, 480)(values.tenureMonths as number) &&
        !inRange(0.1, 50)(values.interestRate as number)
      );
    }
    return true;
  }

  function handleNext() {
    if (step === 0 && isRequired(values.customerId)) {
      showToast('Please select a customer to continue.', 'error');
      return;
    }
    if (step === 1 && !validateAll()) return;
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }

  function handleBack() {
    setStep((s) => Math.max(0, s - 1));
  }

  async function handleSubmit() {
    if (!validateAll()) {
      setStep(1);
      return;
    }
    setSubmitting(true);
    try {
      const payload: LoanApplicationRequest = {
        customerId: values.customerId as number,
        loanType: values.loanType as LoanType,
        loanAmount: values.loanAmount as number,
        tenureMonths: values.tenureMonths as number,
        interestRate: values.interestRate as number,
      };
      const created = await LoanApplicationService.create(payload);
      showToast('Loan application submitted successfully.', 'success');
      navigate(`/loans/${created.id}`);
    } catch (err) {
      showToast(err instanceof AppError ? err.message : 'Unable to submit loan application.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">New Loan Application</h1>
        <p className="mt-1 text-sm text-slate-500">Follow the steps below to submit a new application.</p>
      </div>

      <Card className="p-5">
        <Stepper steps={STEPS} currentStep={step} />
      </Card>

      <Card>
        {step === 0 && (
          <>
            <CardHeader title="Select Customer" subtitle="Choose the customer applying for this loan." />
            <div className="flex flex-col gap-4 p-5">
              {loadingCustomers ? (
                <LoadingSpinner />
              ) : (
                <Select
                  label="Customer"
                  placeholder="Select a customer"
                  value={values.customerId === '' ? '' : String(values.customerId)}
                  onChange={(e) => setValue('customerId', Number(e.target.value))}
                  options={customers.map((c) => ({ value: String(c.id), label: `${c.name} (${c.email})` }))}
                />
              )}

              {selectedCustomer && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">{selectedCustomer.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{selectedCustomer.email}</p>
                  <p className="text-sm text-slate-500">{selectedCustomer.mobile}</p>
                  <p className="text-sm text-slate-500">{selectedCustomer.address}</p>
                </div>
              )}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <CardHeader title="Loan Information" subtitle="Enter the requested loan details." />
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
              <Select
                label="Loan Type"
                placeholder="Select loan type"
                value={values.loanType}
                onChange={handleChange('loanType')}
                onBlur={handleBlur('loanType')}
                error={errors.loanType}
                options={LOAN_TYPE_OPTIONS}
              />
              <Input
                label="Loan Amount"
                type="number"
                min={0}
                value={values.loanAmount}
                onChange={handleChange('loanAmount')}
                onBlur={handleBlur('loanAmount')}
                error={errors.loanAmount}
                placeholder="e.g. 500000"
              />
              <Input
                label="Tenure (months)"
                type="number"
                min={1}
                max={480}
                value={values.tenureMonths}
                onChange={handleChange('tenureMonths')}
                onBlur={handleBlur('tenureMonths')}
                error={errors.tenureMonths}
                placeholder="e.g. 36"
              />
              <Input
                label="Interest Rate (%)"
                type="number"
                step="0.1"
                min={0}
                max={50}
                value={values.interestRate}
                onChange={handleChange('interestRate')}
                onBlur={handleBlur('interestRate')}
                error={errors.interestRate}
                placeholder="e.g. 9.5"
              />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <CardHeader title="Review & Submit" subtitle="Please confirm the details before submitting." />
            <dl className="grid grid-cols-1 gap-6 p-5 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Customer</dt>
                <dd className="mt-1 text-sm text-slate-900">{selectedCustomer?.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Loan Type</dt>
                <dd className="mt-1 text-sm text-slate-900">{titleCase(values.loanType as string)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Loan Amount</dt>
                <dd className="mt-1 text-sm text-slate-900">{formatCurrency(Number(values.loanAmount))}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Tenure</dt>
                <dd className="mt-1 text-sm text-slate-900">{values.tenureMonths} months</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Interest Rate</dt>
                <dd className="mt-1 text-sm text-slate-900">{values.interestRate}%</dd>
              </div>
            </dl>
          </>
        )}

        <div className="flex justify-between border-t border-slate-100 p-5">
          <Button variant="secondary" onClick={step === 0 ? () => navigate('/loans') : handleBack}>
            {step === 0 ? 'Cancel' : 'Back'}
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={handleNext} disabled={step === 0 && !values.customerId}>
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} loading={submitting} disabled={!validateStep()}>
              Submit Loan Application
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
