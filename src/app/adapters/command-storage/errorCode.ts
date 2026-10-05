export function errorCode(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('code' in error)) return
  return typeof error.code === 'string' ? error.code : undefined
}
