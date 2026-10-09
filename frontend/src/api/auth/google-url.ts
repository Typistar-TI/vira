export function googleLoginUrl(url: URL): string {
  return new URL('/api/auth/google', url).href;
}
