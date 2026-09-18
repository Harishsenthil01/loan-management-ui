import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { useForm } from '@/utils/useForm';
import { isRequired, isValidEmail } from '@/utils/validators';
import { AppError } from '@/services/api';

interface LoginFormValues extends Record<string, unknown> {
  email: string;
  password: string;
}

export default function Login() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [remember, setRemember] = useState(false);

  const { values, errors, handleChange, handleBlur, validateAll } = useForm<LoginFormValues>(
    { email: '', password: '' },
    {
      email: (v) => isRequired(v) ?? isValidEmail(v as string),
      password: (v) => isRequired(v),
    },
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError(null);
    if (!validateAll()) return;

    setSubmitting(true);
    try {
      await login({ email: values.email, password: values.password }, remember);
      showToast('Welcome back!', 'success');
      const from = (location.state as { from?: Location })?.from?.pathname ?? '/dashboard';
      navigate(from, { replace: true });
    } catch (err) {
      setApiError(err instanceof AppError ? err.message : 'Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="hidden w-1/2 flex-col justify-between bg-navy-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-navy-900 font-bold">
            L
          </div>
          <span className="text-lg font-semibold">Loan Management System</span>
        </div>
        <div>
          <h1 className="text-3xl font-semibold leading-tight">
            Manage loans, customers, and documents — all in one secure place.
          </h1>
          <p className="mt-4 max-w-md text-navy-200">
            A complete workspace for tracking applications from submission to approval, built for
            modern lending teams.
          </p>
        </div>
        <p className="text-sm text-navy-300">© {new Date().getFullYear()} Loan Management System</p>
      </div>

      {/* Form panel */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500">Welcome back. Please enter your details.</p>

          {apiError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
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
            <Input
              label="Password"
              autoComplete="current-password"
              showPasswordToggle
              value={values.password}
              onChange={handleChange('password')}
              onBlur={handleBlur('password')}
              error={errors.password}
              placeholder="••••••••"
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-navy-700 focus:ring-navy-500"
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={() => showToast('Password reset isn\u2019t available yet. Contact your administrator.', 'info')}
                className="text-sm font-medium text-navy-700 hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <Button type="submit" loading={submitting} className="w-full mt-2">
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-navy-700 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
