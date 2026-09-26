export function preferredLanguage(request: Request): 'pt' | 'en' {
  const languages = (request.headers.get('accept-language') ?? '')
    .split(',')
    .map((entry) => {
      const [tag, ...parameters] = entry.trim().split(';');
      const quality = parameters.find((parameter) => parameter.trim().startsWith('q='));
      return {
        tag: tag.trim().toLowerCase(),
        weight: quality ? Number(quality.trim().slice(2)) : 1,
      };
    })
    .filter(({ weight }) => Number.isFinite(weight) && weight > 0)
    .sort((a, b) => b.weight - a.weight);

  for (const { tag } of languages) {
    if (tag === 'en' || tag.startsWith('en-')) return 'en';
    if (tag === 'pt' || tag.startsWith('pt-')) return 'pt';
  }
  return 'pt';
}
