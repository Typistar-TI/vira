import { z } from 'astro/zod';

const text = (max: number) => z.string().trim().max(max);
const url = z.union([
  z.literal(''),
  z.url().refine((value) => /^https?:\/\//.test(value), 'Use http ou https'),
]);
const imagePath = z.union([
  z.literal(''),
  z.string().regex(/^\/media\/[a-f0-9-]{36}\/[a-f0-9-]{36}\.(jpg|png|webp)$/),
]);

export const siteSchema = z.object({
  layout: z.enum(['pulse', 'editorial', 'showcase']),
  language: z.enum(['pt', 'en']),
  title: text(100),
  appName: text(50).default(''),
  subtitle: text(300),
  heroImage: imagePath,
  logo: imagePath.default(''),
  showInShowcase: z.boolean().default(false),
  favicon: imagePath.default(''),
  pwaIcon192: imagePath.default(''),
  pwaIcon512: imagePath.default(''),
  themeColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default('#ffffff'),
  backgroundColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default('#f9f7fc'),
  textColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default('#30243c'),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default('#684395'),
  primaryLabel: text(40),
  primaryUrl: url,
  aboutTitle: text(80),
  about: text(1500),
  benefits: z.array(z.object({ title: text(80), description: text(240) })).max(6),
  stats: z.array(z.object({ value: text(20), label: text(60) })).max(4),
  testimonials: z.array(z.object({ quote: text(300), name: text(80) })).max(3),
  products: z
    .array(z.object({ title: text(80), description: text(300), image: imagePath, url }))
    .max(12),
  footerText: text(160),
});

export type SiteContent = z.infer<typeof siteSchema>;

export const defaultSite: SiteContent = {
  layout: 'pulse',
  language: 'pt',
  title: 'Este espaço está no ar.',
  appName: '',
  subtitle: 'Uma nova página está sendo preparada. Volte em breve para conhecer as novidades.',
  heroImage: '',
  logo: '',
  showInShowcase: false,
  favicon: '',
  pwaIcon192: '',
  pwaIcon512: '',
  themeColor: '#ffffff',
  backgroundColor: '#f9f7fc',
  textColor: '#30243c',
  accentColor: '#684395',
  primaryLabel: '',
  primaryUrl: '',
  aboutTitle: '',
  about: '',
  benefits: [],
  stats: [],
  testimonials: [],
  products: [],
  footerText: '',
};

export function initialSite(language: 'pt' | 'en'): SiteContent {
  return language === 'en'
    ? {
        ...defaultSite,
        language,
        title: 'This space is live.',
        subtitle: 'A new page is being prepared. Come back soon to see what is next.',
      }
    : defaultSite;
}

export function parseSite(value: unknown): SiteContent {
  const content = siteSchema.parse(value);
  const original =
    typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
  if (
    original.backgroundColor === undefined ||
    original.textColor === undefined ||
    original.accentColor === undefined
  ) {
    const colors =
      content.layout === 'editorial'
        ? { backgroundColor: '#f6f5f0', textColor: '#243942', accentColor: '#1e7778' }
        : content.layout === 'showcase'
          ? { backgroundColor: '#121b27', textColor: '#f6f4f0', accentColor: '#f3a77d' }
          : { backgroundColor: '#f9f7fc', textColor: '#30243c', accentColor: '#684395' };
    if (original.backgroundColor === undefined) content.backgroundColor = colors.backgroundColor;
    if (original.textColor === undefined) content.textColor = colors.textColor;
    if (original.accentColor === undefined) content.accentColor = colors.accentColor;
  }
  return content;
}

export function hasAccess(user: {
  plan: string;
  trial_ends_at: number;
  access_until: number | null;
}): boolean {
  const now = Math.floor(Date.now() / 1000);
  return (
    user.plan === 'lifetime' ||
    (user.plan === 'trial' && user.trial_ends_at > now) ||
    ((user.plan === 'monthly' || user.plan === 'yearly') && (user.access_until ?? 0) > now)
  );
}
