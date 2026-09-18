import { useState, useCallback } from 'react';

type Validators<T> = Partial<Record<keyof T, (value: T[keyof T], values: T) => string | undefined>>;

/**
 * Minimal, dependency-free reactive form hook shared by every form screen
 * in the app (register/login/customer/loan/document/etc). Keeps validation,
 * touched-state and submit handling consistent everywhere.
 */
export function useForm<T extends Record<string, unknown>>(
  initialValues: T,
  validators: Validators<T> = {},
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const validateField = useCallback(
    (field: keyof T, allValues: T = values): string | undefined => {
      const validator = validators[field];
      if (!validator) return undefined;
      return validator(allValues[field], allValues);
    },
    [validators, values],
  );

  const validateAll = useCallback((): boolean => {
    const nextErrors: Partial<Record<keyof T, string>> = {};
    (Object.keys(validators) as (keyof T)[]).forEach((field) => {
      const error = validateField(field, values);
      if (error) nextErrors[field] = error;
    });
    setErrors(nextErrors);
    setTouched(
      Object.keys(values).reduce((acc, k) => ({ ...acc, [k]: true }), {} as Partial<Record<keyof T, boolean>>),
    );
    return Object.keys(nextErrors).length === 0;
  }, [validateField, values, validators]);

  const setValue = useCallback(
    (field: keyof T, value: T[keyof T]) => {
      setValues((prev) => {
        const next = { ...prev, [field]: value };
        return next;
      });
      if (touched[field]) {
        const error = validateField(field, { ...values, [field]: value });
        setErrors((prev) => ({ ...prev, [field]: error }));
      }
    },
    [touched, validateField, values],
  );

  const handleChange = useCallback(
    (field: keyof T) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const raw = e.target;
      const value = raw.type === 'number' ? Number(raw.value) : raw.value;
      setValue(field, value as T[keyof T]);
    },
    [setValue],
  );

  const handleBlur = useCallback(
    (field: keyof T) => () => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      setErrors((prev) => ({ ...prev, [field]: validateField(field) }));
    },
    [validateField],
  );

  const reset = useCallback((next: T = initialValues) => {
    setValues(next);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return { values, errors, touched, setValue, handleChange, handleBlur, validateAll, reset, setValues };
}
