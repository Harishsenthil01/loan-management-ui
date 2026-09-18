import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { useForm } from '@/utils/useForm';
import { isRequired, isValidEmail, isValidMobile } from '@/utils/validators';
import type { CustomerRequest } from '@/models/customer';

interface CustomerFormProps {
  initialValues?: CustomerRequest;
  submitLabel?: string;
  submitting?: boolean;
  onSubmit: (values: CustomerRequest) => void;
  onCancel: () => void;
}

const DEFAULTS: CustomerRequest = { name: '', email: '', mobile: '', address: '' };

export default function CustomerForm({
  initialValues = DEFAULTS,
  submitLabel = 'Save Customer',
  submitting = false,
  onSubmit,
  onCancel,
}: CustomerFormProps) {
  const { values, errors, handleChange, handleBlur, validateAll } = useForm<
    CustomerRequest & Record<string, unknown>
  >(initialValues, {
    name: (v) => isRequired(v),
    email: (v) => isRequired(v) ?? isValidEmail(v as string),
    mobile: (v) => isRequired(v) ?? isValidMobile(v as string),
    address: (v) => isRequired(v),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateAll()) return;
    onSubmit(values as CustomerRequest);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Input
        label="Name"
        value={values.name}
        onChange={handleChange('name')}
        onBlur={handleBlur('name')}
        error={errors.name}
        placeholder="Full name"
      />
      <Input
        label="Email"
        type="email"
        value={values.email}
        onChange={handleChange('email')}
        onBlur={handleBlur('email')}
        error={errors.email}
        placeholder="customer@example.com"
      />
      <Input
        label="Mobile"
        value={values.mobile}
        onChange={handleChange('mobile')}
        onBlur={handleBlur('mobile')}
        error={errors.mobile}
        placeholder="10-digit mobile number"
      />
      <Input
        label="Address"
        value={values.address}
        onChange={handleChange('address')}
        onBlur={handleBlur('address')}
        error={errors.address}
        placeholder="Street, City, State, ZIP"
      />

      <div className="mt-2 flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
