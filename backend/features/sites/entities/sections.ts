import { z } from 'astro/zod';

const text = (max: number) => z.string().trim().max(max);
const url = z.union([
  z.literal(''),
  z.url().refine((value) => /^https?:\/\//.test(value), 'Use http ou https'),
]);
export const imagePath = z.union([
  z.literal(''),
  z.string().regex(/^\/media\/[a-f0-9-]{36}\/[a-f0-9-]{36}\.(jpg|png|webp)$/),
]);
const id = z.string().trim().min(1).max(40);

export const MAX_SECTIONS = 20;

export const sectionTypes = [
  'hero',
  'about',
  'services',
  'gallery',
  'stats',
  'steps',
  'experience',
  'testimonials',
  'faq',
  'video',
  'map',
  'contact',
  'footer',
] as const;
export type SectionType = (typeof sectionTypes)[number];

const link = z.object({ label: text(40), url });
const image = z.object({ image: imagePath });

const hero = z.object({
  id,
  type: z.literal('hero'),
  variant: z.enum(['left', 'center', 'background']).default('left'),
  eyebrow: text(60).default(''),
  title: text(120).default(''),
  subtitle: text(400).default(''),
  image: imagePath.default(''),
  primaryLabel: text(40).default(''),
  primaryUrl: url.default(''),
});

const about = z.object({
  id,
  type: z.literal('about'),
  variant: z.enum(['text', 'image-left', 'image-right']).default('text'),
  title: text(120).default(''),
  body: text(1500).default(''),
  image: imagePath.default(''),
});

const services = z.object({
  id,
  type: z.literal('services'),
  variant: z.enum(['cards', 'list']).default('cards'),
  title: text(120).default(''),
  items: z
    .array(z.object({ title: text(80), description: text(400), image: imagePath, url }))
    .max(12)
    .default([]),
});

const gallery = z.object({
  id,
  type: z.literal('gallery'),
  variant: z.enum(['grid', 'masonry']).default('grid'),
  title: text(120).default(''),
  images: z.array(image).max(12).default([]),
});

const stats = z.object({
  id,
  type: z.literal('stats'),
  variant: z.enum(['row', 'grid']).default('row'),
  title: text(120).default(''),
  items: z
    .array(z.object({ value: text(20), label: text(60) }))
    .max(4)
    .default([]),
});

const steps = z.object({
  id,
  type: z.literal('steps'),
  variant: z.enum(['numbered', 'cards']).default('numbered'),
  title: text(120).default(''),
  items: z
    .array(z.object({ title: text(80), description: text(400) }))
    .max(6)
    .default([]),
});

const experience = z.object({
  id,
  type: z.literal('experience'),
  variant: z.enum(['timeline', 'list']).default('timeline'),
  title: text(120).default(''),
  items: z
    .array(
      z.object({
        role: text(80),
        company: text(80),
        period: text(60),
        location: text(80),
        summary: text(400),
      }),
    )
    .max(10)
    .default([]),
});

const testimonials = z.object({
  id,
  type: z.literal('testimonials'),
  variant: z.enum(['cards', 'single']).default('cards'),
  title: text(120).default(''),
  items: z
    .array(z.object({ quote: text(400), name: text(80) }))
    .max(6)
    .default([]),
});

const faq = z.object({
  id,
  type: z.literal('faq'),
  variant: z.enum(['accordion', 'list']).default('accordion'),
  title: text(120).default(''),
  items: z
    .array(z.object({ question: text(200), answer: text(800) }))
    .max(10)
    .default([]),
});

const video = z.object({
  id,
  type: z.literal('video'),
  variant: z.enum(['wide', 'boxed']).default('wide'),
  title: text(120).default(''),
  url: url.default(''),
  caption: text(200).default(''),
});

const map = z.object({
  id,
  type: z.literal('map'),
  variant: z.enum(['wide', 'boxed']).default('wide'),
  title: text(120).default(''),
  address: text(200).default(''),
});

const contact = z.object({
  id,
  type: z.literal('contact'),
  variant: z.enum(['simple', 'cards']).default('simple'),
  title: text(120).default(''),
  body: text(600).default(''),
  primaryLabel: text(40).default(''),
  primaryUrl: url.default(''),
  links: z.array(link).max(8).default([]),
});

const footer = z.object({
  id,
  type: z.literal('footer'),
  variant: z.enum(['simple']).default('simple'),
  text: text(200).default(''),
  links: z.array(link).max(8).default([]),
});

export const sectionSchema = z.discriminatedUnion('type', [
  hero,
  about,
  services,
  gallery,
  stats,
  steps,
  experience,
  testimonials,
  faq,
  video,
  map,
  contact,
  footer,
]);

export type Section = z.infer<typeof sectionSchema>;
export type SectionOf<T extends SectionType> = Extract<Section, { type: T }>;

const blank: { [T in SectionType]: () => SectionOf<T> } = {
  hero: () => ({
    id: '',
    type: 'hero',
    variant: 'left',
    eyebrow: '',
    title: '',
    subtitle: '',
    image: '',
    primaryLabel: '',
    primaryUrl: '',
  }),
  about: () => ({ id: '', type: 'about', variant: 'text', title: '', body: '', image: '' }),
  services: () => ({ id: '', type: 'services', variant: 'cards', title: '', items: [] }),
  gallery: () => ({ id: '', type: 'gallery', variant: 'grid', title: '', images: [] }),
  stats: () => ({ id: '', type: 'stats', variant: 'row', title: '', items: [] }),
  steps: () => ({ id: '', type: 'steps', variant: 'numbered', title: '', items: [] }),
  experience: () => ({ id: '', type: 'experience', variant: 'timeline', title: '', items: [] }),
  testimonials: () => ({
    id: '',
    type: 'testimonials',
    variant: 'cards',
    title: '',
    items: [],
  }),
  faq: () => ({ id: '', type: 'faq', variant: 'accordion', title: '', items: [] }),
  video: () => ({ id: '', type: 'video', variant: 'wide', title: '', url: '', caption: '' }),
  map: () => ({ id: '', type: 'map', variant: 'wide', title: '', address: '' }),
  contact: () => ({
    id: '',
    type: 'contact',
    variant: 'simple',
    title: '',
    body: '',
    primaryLabel: '',
    primaryUrl: '',
    links: [],
  }),
  footer: () => ({ id: '', type: 'footer', variant: 'simple', text: '', links: [] }),
};

export function blankSection<T extends SectionType>(type: T): SectionOf<T> {
  return blank[type]() as SectionOf<T>;
}

/** One item template used by the editor and by empty sections. */
export type SectionItem = { title: string; description: string; image: string; url: string };

export const videoHosts = [
  {
    name: 'YouTube',
    pattern: /^(https?:)?\/\/(www\.)?(youtube\.com\/(watch\?v=|embed\/|shorts\/)|youtu\.be\/)/i,
  },
  { name: 'Vimeo', pattern: /^(https?:)?\/\/(www\.)?vimeo\.com\//i },
];

export function embedUrl(value: string): string | null {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') {
      const id = parsed.pathname.slice(1);
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const id =
        parsed.searchParams.get('v') ||
        parsed.pathname.match(/^\/(?:embed|shorts)\/([\w-]+)/)?.[1] ||
        '';
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (host === 'vimeo.com') {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {
    /* not a valid url */
  }
  return null;
}
