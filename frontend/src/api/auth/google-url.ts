export function googleLoginUrl(url: URL): string {
  const login = new URL('/api/auth/google', url);
  login.searchParams.set('next', url.searchParams.get('next') === 'admin' ? 'admin' : 'app');
  return login.href;
}
