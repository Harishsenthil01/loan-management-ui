import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Input from '@/components/common/Input';
import Select from '@/components/common/Select';
import Button from '@/components/common/Button';
import { useForm } from '@/utils/useForm';
import { isRequired, isValidEmail, minLength, matches } from '@/utils/validators';
import { AppError } from '@/services/api';
import type { UserRole } from '@/models/user';

interface RegisterFormValues extends Record<string, unknown> {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole | '';
}

export default function Register() {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { values, errors, handleChange, handleBlur, validateAll } = useForm<RegisterFormValues>(
    { name: '', email: '', password: '', confirmPassword: '', role: '' },
    {
      name: (v) => isRequired(v),
      email: (v) => isRequired(v) ?? isValidEmail(v as string),
      password: (v) => isRequired(v) ?? minLength(8)(v as string),
      confirmPassword: (v, all) => isRequired(v) ?? matches(all.password as string, 'Passwords do not match.')(v as string),
      role: (v) => isRequired(v),
    },
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);
    if (!validateAll()) return;

    setSubmitting(true);
    try {
      await register({
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role as UserRole,
      });
      showToast('Account created successfully. Please sign in.', 'success');
      navigate('/login', { replace: true });
    } catch (err) {
      setApiError(
        err instanceof AppError
          ? err.status === 409
            ? 'An account with this email already exists.'
            : err.message
          : 'Unable to create your account. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-700 text-white font-bold">
            L
          </div>
          <span className="text-lg font-semibold text-slate-900">Loan Management System</span>
        </div>

        <h2 className="text-2xl font-semibold text-slate-900">Create your account</h2>
        <p className="mt-1 text-sm text-slate-500">Get started managing loans in minutes.</p>

        {apiError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
          <Input
            label="Full Name"
            autoComplete="name"
            value={values.name}
            onChange={handleChange('name')}
            onBlur={handleBlur('name')}
            error={errors.name}
            placeholder="Jane Doe"
          />
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={handleChange('email')}
            onBlur={handleBlur('email')}
            error={errors.email}
            placeholder="you@company.com"
          />
          <Select
            label="Role"
            placeholder="Select a role"
            value={values.role}
            onChange={handleChange('role')}
            onBlur={handleBlur('role')}
            error={errors.role}
            options={[
              { value: 'USER', label: 'User' },
              { value: 'ADMIN', label: 'Admin' },
            ]}
          />
          <Input
            label="Password"
            autoComplete="new-password"
            showPasswordToggle
            value={values.password}
            onChange={handleChange('password')}
            onBlur={handleBlur('password')}
            error={errors.password}
            hint={!errors.password ? 'At least 8 characters.' : undefined}
            placeholder="••••••••"
          />
          <Input
            label="Confirm Password"
            autoComplete="new-password"
            showPasswordToggle
            value={values.confirmPassword}
            onChange={handleChange('confirmPassword')}
            onBlur={handleBlur('confirmPassword')}
            error={errors.confirmPassword}
            placeholder="••••••••"
          />

          <Button type="submit" loading={submitting} className="w-full mt-2">
            Create Account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-navy-700 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
