import type { SiteContent } from '@backend/features/sites/model';
import type { PriceRow } from '@backend/features/billing/service';

function cut(value: string, max: number): string {
  const clean = value.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max).trimEnd()}…` : clean;
}

/**
 * Turns the subscriber's published page into a short, factual knowledge block.
 * Only what is stored in D1 is shared; nothing is invented.
 */
export function siteKnowledge(content: SiteContent, en: boolean): string {
  const lines: string[] = [];
  const name = content.appName || content.title;
  if (name) lines.push(`${en ? 'Name' : 'Nome'}: ${cut(name, 120)}`);
  if (content.title) lines.push(`${en ? 'Headline' : 'Título'}: ${cut(content.title, 160)}`);
  if (content.subtitle) lines.push(`${en ? 'Summary' : 'Resumo'}: ${cut(content.subtitle, 320)}`);
  if (content.about)
    lines.push(
      `${en ? 'About' : 'Sobre'}: ${cut([content.aboutTitle, content.about].filter(Boolean).join(' — '), 700)}`,
    );

  const benefits = content.benefits.filter((item) => item.title);
  if (benefits.length)
    lines.push(
      `${en ? 'Highlights' : 'Destaques'}: ` +
        benefits
          .map((item) =>
            cut(`${item.title}${item.description ? ` — ${item.description}` : ''}`, 220),
          )
          .join('; '),
    );

  const stats = content.stats.filter((item) => item.value);
  if (stats.length)
    lines.push(
      `${en ? 'Numbers' : 'Números'}: ` +
        stats.map((item) => cut(`${item.value} ${item.label}`, 120)).join('; '),
    );

  const products = content.products.filter((item) => item.title);
  if (products.length)
    lines.push(
      `${en ? 'Offerings' : 'Ofertas'}: ` +
        products
          .map((item) =>
            cut(`${item.title}${item.description ? ` — ${item.description}` : ''}`, 240),
          )
          .join('; '),
    );

  const testimonials = content.testimonials.filter((item) => item.quote);
  if (testimonials.length)
    lines.push(
      `${en ? 'Testimonials' : 'Depoimentos'}: ` +
        testimonials
          .map((item) => cut(`"${item.quote}"${item.name ? ` — ${item.name}` : ''}`, 220))
          .join('; '),
    );

  if (content.primaryLabel)
    lines.push(
      `${en ? 'Main contact action' : 'Ação de contato principal'}: ${cut(content.primaryLabel, 120)}`,
    );
  if (content.footerText)
    lines.push(`${en ? 'Footer note' : 'Nota do rodapé'}: ${cut(content.footerText, 220)}`);

  return lines.join('\n');
}

function formatMoney(amountMinor: number, currency: string, en: boolean): string {
  return new Intl.NumberFormat(en ? 'en-US' : 'pt-BR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amountMinor / 100);
}

/**
 * Knowledge base used by the marketing demo. It describes Vira itself and
 * reuses the real plans published in D1, so the demo never quotes stale prices.
 */
export function viraKnowledge(en: boolean, prices: PriceRow[]): string {
  const planName = (plan: PriceRow['plan']) =>
    en
      ? plan === 'monthly'
        ? 'Monthly'
        : plan === 'yearly'
          ? 'Yearly'
          : 'Lifetime'
      : plan === 'monthly'
        ? 'Mensal'
        : plan === 'yearly'
          ? 'Anual'
          : 'Vitalício';
  const active = prices.filter((row) => row.amount_minor && row.amount_minor > 0);
  const priceLines = active
    .map(
      (row) =>
        `${planName(row.plan)} (${row.currency.toUpperCase()}): ${formatMoney(row.amount_minor!, row.currency, en)}`,
    )
    .join('; ');
  const priceNote = priceLines
    ? `${en ? 'Published prices' : 'Preços publicados'}: ${priceLines}`
    : en
      ? 'Prices are shown on the plans section of the site.'
      : 'Os preços aparecem na seção de planos do site.';

  return en
    ? [
        'Name: Vira (vira.ia.br)',
        'What it is: a platform to create, edit and publish sales pages without code, with a personal AI assistant included.',
        'Main features: server-rendered pages with five layouts (Guardian, Control room, Profile, Studio and Classic); live editing of texts, images, logo, colors, products, services, steps, FAQ, experience, testimonials and stats; publishing on a free Vira subdomain or on the customer own domain; image uploads; basic analytics; installable PWA; and a personal AI assistant that answers visitor questions using the content stored for that site.',
        'How it works: sign in with email link or Google (no password); the account starts with a ready page and address; edit and publish in the dashboard.',
        'Trial and plans: one day free without a card; then Monthly, Yearly or Lifetime.',
        priceNote,
        'The AI assistant answers simple questions about the business using only the content the owner filled in, and is available to every account with active access.',
      ].join('\n')
    : [
        'Nome: Vira (vira.ia.br)',
        'O que é: uma plataforma para criar, editar e publicar páginas de vendas sem programar, com uma assistente de IA própria incluída.',
        'Principais recursos: páginas renderizadas no servidor com cinco layouts (Guardião, Central, Perfil, Estúdio e Clássico); edição ao vivo de textos, imagens, logo, cores, produtos, serviços, passos, perguntas frequentes, experiência, depoimentos e números; publicação em subdomínio Vira gratuito ou em domínio próprio; envio de imagens; estatísticas básicas; PWA instalável; e uma assistente de IA que responde perguntas dos visitantes usando o conteúdo cadastrado daquela página.',
        'Como funciona: entre com link por e-mail ou com o Google (sem senha); a conta já começa com uma página e um endereço prontos; edite e publique no painel.',
        'Teste e planos: um dia grátis sem cartão; depois Mensal, Anual ou Vitalício.',
        priceNote,
        'A assistente de IA responde perguntas simples sobre o negócio usando apenas o conteúdo preenchido pelo responsável e fica disponível para toda conta com acesso ativo.',
      ].join('\n');
}
