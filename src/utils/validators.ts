export const isRequired = (value: unknown): string | undefined => {
  if (value === null || value === undefined) return 'This field is required.';
  if (typeof value === 'string' && value.trim().length === 0) return 'This field is required.';
  return undefined;
};

export const isValidEmail = (value: string): string | undefined => {
  if (!value) return undefined;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(value) ? undefined : 'Please enter a valid email address.';
};

export const minLength = (min: number) => (value: string): string | undefined => {
  if (!value) return undefined;
  return value.length >= min ? undefined : `Must be at least ${min} characters.`;
};

export const isValidMobile = (value: string): string | undefined => {
  if (!value) return undefined;
  const re = /^[0-9]{10}$/;
  return re.test(value) ? undefined : 'Please enter a valid 10-digit mobile number.';
};

export const isPositiveNumber = (value: number | string): string | undefined => {
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num)) return 'Please enter a valid number.';
  return num > 0 ? undefined : 'Must be greater than zero.';
};

export const inRange = (min: number, max: number) => (value: number | string): string | undefined => {
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num)) return 'Please enter a valid number.';
  if (num < min || num > max) return `Must be between ${min} and ${max}.`;
  return undefined;
};

export const matches = (otherValue: string, message: string) => (value: string): string | undefined => {
  return value === otherValue ? undefined : message;
};

/**
 * Runs a list of validators for one field and returns the first failure, if any.
 */
export function runValidators(
  value: unknown,
  validators: Array<(v: never) => string | undefined>,
): string | undefined {
  for (const validate of validators) {
    const result = validate(value as never);
    if (result) return result;
  }
  return undefined;
}
