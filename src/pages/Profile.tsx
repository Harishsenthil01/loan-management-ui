import { useState } from 'react';
import { Card, CardHeader } from '@/components/common/Surfaces';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Badge from '@/components/common/Badge';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useForm } from '@/utils/useForm';
import { isRequired, isValidEmail } from '@/utils/validators';
import { AuthService } from '@/services/auth.service';
import { AppError } from '@/services/api';
import { initials } from '@/utils/formatters';

interface FormValues extends Record<string, unknown> {
  name: string;
  email: string;
}

export default function Profile() {
  const { user, setUser } = useAuth();
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { values, errors, handleChange, handleBlur, validateAll, reset } = useForm<FormValues>(
    { name: user?.name ?? '', email: user?.email ?? '' },
    {
      name: (v) => isRequired(v),
      email: (v) => isRequired(v) ?? isValidEmail(v as string),
    },
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !validateAll()) return;
    setSubmitting(true);
    try {
      const updated = await AuthService.updateProfile(user.id, { name: values.name, email: values.email });
      setUser(updated);
      showToast('Profile updated successfully.', 'success');
      setEditing(false);
    } catch (err) {
      showToast(err instanceof AppError ? err.message : 'Unable to update profile.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) return null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your account information.</p>
      </div>

      <Card>
        <div className="flex items-center gap-4 border-b border-slate-100 p-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-navy-100 text-lg font-semibold text-navy-700">
            {initials(user.name)}
          </div>
          <div>
            <p className="text-base font-semibold text-slate-900">{user.name}</p>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
          <div className="ml-auto">
            <Badge status={user.role} />
          </div>
        </div>

        <CardHeader
          title="Account Details"
          action={
            !editing && (
              <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
                Edit
              </Button>
            )
          }
        />

        {editing ? (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 p-5">
            <Input
              label="Name"
              value={values.name}
              onChange={handleChange('name')}
              onBlur={handleBlur('name')}
              error={errors.name}
            />
            <Input
              label="Email"
              type="email"
              value={values.email}
              onChange={handleChange('email')}
              onBlur={handleBlur('email')}
              error={errors.email}
            />
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={submitting}
                onClick={() => {
                  reset({ name: user.name, email: user.email });
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                Save Changes
              </Button>
            </div>
          </form>
        ) : (
          <dl className="grid grid-cols-1 gap-6 p-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Name</dt>
              <dd className="mt-1 text-sm text-slate-900">{user.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Email</dt>
              <dd className="mt-1 text-sm text-slate-900">{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Role</dt>
              <dd className="mt-1 text-sm text-slate-900">{user.role}</dd>
            </div>
          </dl>
        )}
      </Card>
    </div>
  );
}
