import { z } from 'astro/zod';

const text = (max: number) => z.string().trim().max(max);
const url = z.union([z.literal(''), z.url().refine((value) => /^https?:\/\//.test(value), 'Use http ou https')]);
const imagePath = z.union([z.literal(''), z.string().regex(/^\/media\/[a-f0-9-]{36}\/[a-f0-9-]{36}\.(jpg|png|webp)$/)]);

export const siteSchema = z.object({
  layout: z.enum(['pulse', 'editorial', 'showcase']),
  language: z.enum(['pt', 'en']),
  title: text(100),
  subtitle: text(300),
  heroImage: imagePath,
  primaryLabel: text(40),
  primaryUrl: url,
  aboutTitle: text(80),
  about: text(1500),
  benefits: z.array(z.object({ title: text(80), description: text(240) })).max(6),
  stats: z.array(z.object({ value: text(20), label: text(60) })).max(4),
  testimonials: z.array(z.object({ quote: text(300), name: text(80) })).max(3),
  products: z.array(z.object({ title: text(80), description: text(300), image: imagePath, url })).max(12),
  footerText: text(160),
});

export type SiteContent = z.infer<typeof siteSchema>;

export const defaultSite: SiteContent = {
  layout: 'pulse', language: 'pt', title: 'Sua ideia merece ser vista.',
  subtitle: 'Apresente seu trabalho em uma página clara, bonita e pronta para receber clientes.',
  heroImage: '', primaryLabel: 'Fale comigo', primaryUrl: '',
  aboutTitle: 'O que fazemos', about: 'Conte aqui o que torna seu trabalho especial.',
  benefits: [
    { title: 'Atendimento próximo', description: 'Explique o primeiro motivo para escolher você.' },
    { title: 'Feito com cuidado', description: 'Mostre o resultado que seu cliente pode esperar.' },
  ],
  stats: [{ value: '100+', label: 'clientes atendidos' }],
  testimonials: [], products: [], footerText: '',
};

export function parseSite(value: unknown): SiteContent {
  return siteSchema.parse(value);
}

export function hasAccess(user: { plan: string; trial_ends_at: number; access_until: number | null }): boolean {
  const now = Math.floor(Date.now() / 1000);
  return user.plan === 'lifetime' ||
    (user.plan === 'trial' && user.trial_ends_at > now) ||
    ((user.plan === 'monthly' || user.plan === 'yearly') && (user.access_until ?? 0) > now);
}
