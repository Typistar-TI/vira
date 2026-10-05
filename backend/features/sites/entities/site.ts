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

export const layouts = ['guardiao', 'central', 'perfil', 'estudio', 'classico'] as const;
export type Layout = (typeof layouts)[number];

const legacyLayouts: Record<string, Layout> = {
  pulse: 'classico',
  editorial: 'perfil',
  showcase: 'central',
};

export const fontKeys = ['outfit', 'bricolage', 'inter', 'instrument', 'gilda'] as const;
export type FontKey = (typeof fontKeys)[number];

export const fontStacks: Record<FontKey, { display: string; body: string; mono: string }> = {
  outfit: {
    display: "'Outfit', sans-serif",
    body: "'Outfit', sans-serif",
    mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  },
  bricolage: {
    display: "'Bricolage Grotesque', 'Outfit', sans-serif",
    body: "'Manrope', 'Outfit', sans-serif",
    mono: "'IBM Plex Mono', ui-monospace, monospace",
  },
  inter: {
    display: "'Inter', 'Outfit', sans-serif",
    body: "'Inter', 'Outfit', sans-serif",
    mono: "'IBM Plex Mono', ui-monospace, monospace",
  },
  instrument: {
    display: "'Instrument Serif', Georgia, serif",
    body: "'Manrope', 'Outfit', sans-serif",
    mono: "'IBM Plex Mono', ui-monospace, monospace",
  },
  gilda: {
    display: "'Gilda Display', Georgia, serif",
    body: "'Outfit', sans-serif",
    mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  },
};

const googleFonts = 'https://fonts.googleapis.com/css2?';
const plex = 'family=IBM+Plex+Mono:wght@400;600';
const manrope = 'family=Manrope:wght@400;500;600;700';

export const fontHrefs: Record<FontKey, string> = {
  outfit: '',
  bricolage: `${googleFonts}family=Bricolage+Grotesque:opsz,wght@12..96,400..700&${manrope}&${plex}&display=swap`,
  inter: `${googleFonts}family=Inter:wght@400;500;600;700&${plex}&display=swap`,
  instrument: `${googleFonts}family=Instrument+Serif:ital@0;1&${manrope}&${plex}&display=swap`,
  gilda: `${googleFonts}family=Gilda+Display&display=swap`,
};

export const defaultLayoutFonts: Record<Layout, FontKey> = {
  guardiao: 'bricolage',
  central: 'inter',
  perfil: 'instrument',
  estudio: 'gilda',
  classico: 'outfit',
};

export const defaultLayoutColors: Record<
  Layout,
  { backgroundColor: string; textColor: string; accentColor: string }
> = {
  guardiao: { backgroundColor: '#0f1310', textColor: '#f1f4ef', accentColor: '#8ae07d' },
  central: { backgroundColor: '#090d0f', textColor: '#f4f7f5', accentColor: '#ff7919' },
  perfil: { backgroundColor: '#11120f', textColor: '#f3ede4', accentColor: '#c9a86a' },
  estudio: { backgroundColor: '#ffffff', textColor: '#552200', accentColor: '#552200' },
  classico: { backgroundColor: '#ffffff', textColor: '#17130d', accentColor: '#b88333' },
};

export const siteSchema = z.object({
  layout: z.enum(layouts),
  font: z.enum(fontKeys).default('outfit'),
  language: z.enum(['pt', 'en']),
  title: text(100),
  eyebrow: text(60).default(''),
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
    .default('#ffffff'),
  textColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default('#17130d'),
  accentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default('#b88333'),
  primaryLabel: text(40),
  primaryUrl: url,
  snippet: text(300).default(''),
  aboutTitle: text(80),
  about: text(1500),
  benefits: z.array(z.object({ title: text(80), description: text(240) })).max(6),
  steps: z
    .array(z.object({ title: text(80), description: text(240) }))
    .max(6)
    .default([]),
  stats: z.array(z.object({ value: text(20), label: text(60) })).max(4),
  experience: z
    .array(
      z.object({
        role: text(80),
        company: text(80),
        period: text(60),
        location: text(80),
        summary: text(400),
      }),
    )
    .max(8)
    .default([]),
  testimonials: z.array(z.object({ quote: text(300), name: text(80) })).max(3),
  faq: z
    .array(z.object({ question: text(160), answer: text(600) }))
    .max(8)
    .default([]),
  products: z
    .array(z.object({ title: text(80), description: text(300), image: imagePath, url }))
    .max(12),
  gallery: z
    .array(z.object({ image: imagePath }))
    .max(12)
    .default([]),
  links: z
    .array(z.object({ label: text(40), url }))
    .max(8)
    .default([]),
  footerText: text(160),
});

export type SiteContent = z.infer<typeof siteSchema>;

export const defaultSite: SiteContent = {
  layout: 'classico',
  font: 'outfit',
  language: 'pt',
  title: 'Este espaço está no ar.',
  eyebrow: '',
  appName: '',
  subtitle: 'Uma nova página está sendo preparada. Volte em breve para conhecer as novidades.',
  heroImage: '',
  logo: '',
  showInShowcase: false,
  favicon: '',
  pwaIcon192: '',
  pwaIcon512: '',
  themeColor: '#ffffff',
  backgroundColor: '#ffffff',
  textColor: '#17130d',
  accentColor: '#b88333',
  primaryLabel: '',
  primaryUrl: '',
  snippet: '',
  aboutTitle: '',
  about: '',
  benefits: [],
  steps: [],
  stats: [],
  experience: [],
  testimonials: [],
  faq: [],
  products: [],
  gallery: [],
  links: [],
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

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

export function parseSite(value: unknown): SiteContent {
  const original = asRecord(value);
  const migrated: Record<string, unknown> = { ...original };
  if (typeof original.layout === 'string' && original.layout in legacyLayouts)
    migrated.layout = legacyLayouts[original.layout];
  const content = siteSchema.parse(migrated);
  if (
    original.backgroundColor === undefined ||
    original.textColor === undefined ||
    original.accentColor === undefined
  ) {
    const colors = defaultLayoutColors[content.layout];
    if (original.backgroundColor === undefined) content.backgroundColor = colors.backgroundColor;
    if (original.textColor === undefined) content.textColor = colors.textColor;
    if (original.accentColor === undefined) content.accentColor = colors.accentColor;
  }
  if (original.font === undefined) content.font = defaultLayoutFonts[content.layout];
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
