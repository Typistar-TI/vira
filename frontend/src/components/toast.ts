export function showToast(message: string, kind: 'success' | 'error' | 'info' = 'info') {
  if (typeof window === 'undefined') return;
  document.dispatchEvent(new CustomEvent('vira:toast', { detail: { message, kind } }));
}

export function reportError(error: unknown, fallback: string) {
  if (error instanceof Error && 'toastShown' in error) return;
  const message = error instanceof Error ? error.message : fallback;
  showToast(message, 'error');
  if (error instanceof Error) Object.assign(error, { toastShown: true });
}
