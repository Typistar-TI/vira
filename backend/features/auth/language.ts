export function languageFromRequest(request: Request): 'pt' | 'en' {
  const languages = (request.headers.get('accept-language') ?? '')
    .split(',')
    .map((entry) => {
      const [tag, quality] = entry.trim().split(';q=');
      return { tag: tag.toLowerCase(), weight: quality ? Number(quality) : 1 };
    })
    .filter(({ weight }) => Number.isFinite(weight) && weight > 0)
    .sort((a, b) => b.weight - a.weight);
  for (const { tag } of languages) {
    if (tag === 'en' || tag.startsWith('en-')) return 'en';
    if (tag === 'pt' || tag.startsWith('pt-')) return 'pt';
  }
  return 'pt';
}
