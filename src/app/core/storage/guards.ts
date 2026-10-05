export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function isArrayOf<T>(guard: (value: unknown) => value is T) {
  return (value: unknown): value is T[] => Array.isArray(value) && value.every(guard);
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isOneOf<const T extends readonly string[]>(
  options: T,
): (value: unknown) => value is T[number] {
  return (value: unknown): value is T[number] =>
    typeof value === 'string' && (options as readonly string[]).includes(value);
}
