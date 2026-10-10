import { z } from 'astro/zod';
import { imagePath, MAX_SECTIONS, sectionSchema, type Section } from './sections';
import { exampleSite } from './example';

const text = (max: number) => z.string().trim().max(max);

export { imagePath } from './sections';

const legacyLayouts: Record<string, string> = {
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

export const legacyThemes: Record<
  string,
  { font: FontKey; backgroundColor: string; textColor: string; accentColor: string }
> = {
  guardiao: {
    font: 'bricolage',
    backgroundColor: '#e8e9e5',
    textColor: '#242724',
    accentColor: '#70d65a',
  },
  central: {
    font: 'inter',
    backgroundColor: '#f5f2eb',
    textColor: '#111719',
    accentColor: '#ff7919',
  },
  perfil: {
    font: 'instrument',
    backgroundColor: '#11120f',
    textColor: '#f3ede4',
    accentColor: '#c9c4ba',
  },
  estudio: {
    font: 'gilda',
    backgroundColor: '#ffffff',
    textColor: '#552200',
    accentColor: '#552200',
  },
  classico: {
    font: 'outfit',
    backgroundColor: '#ffffff',
    textColor: '#17130d',
    accentColor: '#b88333',
  },
  blank: {
    font: 'outfit',
    backgroundColor: '#ffffff',
    textColor: '#17130d',
    accentColor: '#17130d',
  },
};

export const siteSchema = z.object({
  font: z.enum(fontKeys).default('outfit'),
  language: z.enum(['pt', 'en']),
  title: text(100),
  appName: text(50).default(''),
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
  assistant: z.boolean().default(true),
  sections: z.array(sectionSchema).max(MAX_SECTIONS).default([]),
});

export type SiteContent = z.infer<typeof siteSchema>;

export const defaultSite: SiteContent = {
  font: 'outfit',
  language: 'pt',
  title: 'Este espaço está no ar.',
  appName: '',
  logo: '',
  showInShowcase: false,
  favicon: '',
  pwaIcon192: '',
  pwaIcon512: '',
  themeColor: '#ffffff',
  backgroundColor: '#ffffff',
  textColor: '#17130d',
  accentColor: '#b88333',
  assistant: true,
  sections: [],
};

/** The single, simple black-and-white page every new account starts from. */
export function initialSite(language: 'pt' | 'en'): SiteContent {
  return exampleSite(language);
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function nonEmpty(value: unknown): boolean {
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(value);
}

/** Rebuilds a section list from the pre-sections flat content, losing nothing. */
function sectionsFromLegacy(original: Record<string, unknown>): Section[] {
  const sections: Section[] = [];
  const legacy = original;
  if (nonEmpty(legacy.title) || nonEmpty(legacy.subtitle) || nonEmpty(legacy.heroImage)) {
    sections.push({
      id: 'hero',
      type: 'hero',
      variant: 'left',
      eyebrow: typeof legacy.eyebrow === 'string' ? legacy.eyebrow : '',
      title: typeof legacy.title === 'string' ? legacy.title : '',
      subtitle: typeof legacy.subtitle === 'string' ? legacy.subtitle : '',
      image: typeof legacy.heroImage === 'string' ? legacy.heroImage : '',
      primaryLabel: typeof legacy.primaryLabel === 'string' ? legacy.primaryLabel : '',
      primaryUrl: typeof legacy.primaryUrl === 'string' ? legacy.primaryUrl : '',
    });
  }
  if (nonEmpty(legacy.about) || nonEmpty(legacy.aboutTitle)) {
    sections.push({
      id: 'about',
      type: 'about',
      variant: 'text',
      title: typeof legacy.aboutTitle === 'string' ? legacy.aboutTitle : '',
      body: typeof legacy.about === 'string' ? legacy.about : '',
      image: '',
    });
  }
  const list = (value: unknown) => (Array.isArray(value) ? value : []);
  if (list(legacy.benefits).length) {
    sections.push({
      id: 'services',
      type: 'services',
      variant: 'cards',
      title: '',
      items: list(legacy.benefits).map((item) => {
        const row = asRecord(item);
        return {
          title: typeof row.title === 'string' ? row.title : '',
          description: typeof row.description === 'string' ? row.description : '',
          image: '',
          url: '',
        };
      }),
    });
  }
  if (list(legacy.products).length) {
    sections.push({
      id: 'products',
      type: 'services',
      variant: 'cards',
      title: '',
      items: list(legacy.products).map((item) => {
        const row = asRecord(item);
        return {
          title: typeof row.title === 'string' ? row.title : '',
          description: typeof row.description === 'string' ? row.description : '',
          image: typeof row.image === 'string' ? row.image : '',
          url: typeof row.url === 'string' ? row.url : '',
        };
      }),
    });
  }
  if (list(legacy.gallery).length) {
    sections.push({
      id: 'gallery',
      type: 'gallery',
      variant: 'grid',
      title: '',
      images: list(legacy.gallery).map((item) => {
        const row = asRecord(item);
        return { image: typeof row.image === 'string' ? row.image : '' };
      }),
    });
  }
  if (list(legacy.stats).length) {
    sections.push({
      id: 'stats',
      type: 'stats',
      variant: 'row',
      title: '',
      items: list(legacy.stats).map((item) => {
        const row = asRecord(item);
        return {
          value: typeof row.value === 'string' ? row.value : '',
          label: typeof row.label === 'string' ? row.label : '',
        };
      }),
    });
  }
  if (list(legacy.steps).length) {
    sections.push({
      id: 'steps',
      type: 'steps',
      variant: 'numbered',
      title: '',
      items: list(legacy.steps).map((item) => {
        const row = asRecord(item);
        return {
          title: typeof row.title === 'string' ? row.title : '',
          description: typeof row.description === 'string' ? row.description : '',
        };
      }),
    });
  }
  if (list(legacy.experience).length) {
    sections.push({
      id: 'experience',
      type: 'experience',
      variant: 'timeline',
      title: '',
      items: list(legacy.experience).map((item) => {
        const row = asRecord(item);
        return {
          role: typeof row.role === 'string' ? row.role : '',
          company: typeof row.company === 'string' ? row.company : '',
          period: typeof row.period === 'string' ? row.period : '',
          location: typeof row.location === 'string' ? row.location : '',
          summary: typeof row.summary === 'string' ? row.summary : '',
        };
      }),
    });
  }
  if (list(legacy.testimonials).length) {
    sections.push({
      id: 'testimonials',
      type: 'testimonials',
      variant: 'cards',
      title: '',
      items: list(legacy.testimonials).map((item) => {
        const row = asRecord(item);
        return {
          quote: typeof row.quote === 'string' ? row.quote : '',
          name: typeof row.name === 'string' ? row.name : '',
        };
      }),
    });
  }
  if (list(legacy.faq).length) {
    sections.push({
      id: 'faq',
      type: 'faq',
      variant: 'accordion',
      title: '',
      items: list(legacy.faq).map((item) => {
        const row = asRecord(item);
        return {
          question: typeof row.question === 'string' ? row.question : '',
          answer: typeof row.answer === 'string' ? row.answer : '',
        };
      }),
    });
  }
  sections.push({
    id: 'footer',
    type: 'footer',
    variant: 'simple',
    text: typeof legacy.footerText === 'string' ? legacy.footerText : '',
    links: list(legacy.links).map((item) => {
      const row = asRecord(item);
      return {
        label: typeof row.label === 'string' ? row.label : '',
        url: typeof row.url === 'string' ? row.url : '',
      };
    }),
  });
  return sections;
}

function legacyStarterKey(original: Record<string, unknown>): string | null {
  const raw = original.layout;
  if (typeof raw !== 'string') return null;
  const key = legacyLayouts[raw] || raw;
  return key in legacyThemes ? key : null;
}

const legacyOnlyKeys = [
  'subtitle',
  'heroImage',
  'primaryLabel',
  'primaryUrl',
  'about',
  'aboutTitle',
  'benefits',
  'products',
  'gallery',
  'stats',
  'steps',
  'experience',
  'testimonials',
  'faq',
  'links',
  'footerText',
  'eyebrow',
  'snippet',
];

export function parseSite(value: unknown): SiteContent {
  const original = asRecord(value);
  const migrated: Record<string, unknown> = { ...original };
  delete migrated.layout;
  delete migrated.snippet;
  const hasSections = Array.isArray(original.sections) && original.sections.length > 0;
  const hasLegacyContent = legacyOnlyKeys.some((key) => nonEmpty(original[key]));
  if (!hasSections && hasLegacyContent) migrated.sections = sectionsFromLegacy(original);
  const content = siteSchema.parse(migrated);
  const theme = legacyThemes[legacyStarterKey(original) ?? 'blank'];
  if (original.backgroundColor === undefined) content.backgroundColor = theme.backgroundColor;
  if (original.textColor === undefined) content.textColor = theme.textColor;
  if (original.accentColor === undefined) content.accentColor = theme.accentColor;
  if (original.font === undefined) content.font = theme.font;
  return content;
}

/** All images stored in a site, used to check ownership before saving. */
export function siteImages(content: SiteContent): string[] {
  const images = [content.logo, content.favicon, content.pwaIcon192, content.pwaIcon512];
  for (const section of content.sections) {
    if (section.type === 'hero' || section.type === 'about') images.push(section.image);
    if (section.type === 'services') images.push(...section.items.map((item) => item.image));
    if (section.type === 'gallery') images.push(...section.images.map((item) => item.image));
  }
  return images.filter(Boolean);
}

/** Products across services sections, kept in a stable order for click tracking. */
export function siteProducts(content: SiteContent): { url: string; title: string }[] {
  return content.sections
    .filter((section) => section.type === 'services')
    .flatMap((section) => section.items.map((item) => ({ url: item.url, title: item.title })));
}

/** The first call to action on the page. */
export function sitePrimaryUrl(content: SiteContent): string {
  for (const section of content.sections) {
    if (section.type === 'hero' && section.primaryUrl) return section.primaryUrl;
    if (section.type === 'contact' && section.primaryUrl) return section.primaryUrl;
  }
  return '';
}

/** Label of the first call to action, used to name the tracked click. */
export function sitePrimaryLabel(content: SiteContent): string {
  for (const section of content.sections) {
    if (section.type === 'hero' && section.primaryUrl) return section.primaryLabel;
    if (section.type === 'contact' && section.primaryUrl) return section.primaryLabel;
  }
  return '';
}

export function hasAccess(user: {
  plan: string;
  trial_ends_at: number;
  access_until: number | null;
}): boolean {
  const now = Math.floor(Date.now() / 1000);
  return (
    (user.plan === 'trial' && user.trial_ends_at > now) ||
    ((user.plan === 'monthly' || user.plan === 'yearly') && (user.access_until ?? 0) > now)
  );
}
