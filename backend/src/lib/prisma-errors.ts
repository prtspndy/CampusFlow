export function isPrismaCode(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === code
  );
}

export function uniqueConstraintTargets(error: unknown): string[] {
  if (typeof error !== 'object' || error === null || !('meta' in error)) return [];
  const target = (error as { meta?: { target?: unknown } }).meta?.target;
  const values = Array.isArray(target) ? target : target ? [target] : [];
  return values.map((value) => String(value).toLowerCase());
}

export function uniqueConstraintIncludes(error: unknown, field: string): boolean {
  const needle = field.toLowerCase();
  return uniqueConstraintTargets(error).some((target) => target.includes(needle));
}
