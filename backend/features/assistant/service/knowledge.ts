import type { SiteContent } from '@backend/features/sites/entities/site';
import type { PriceRow } from '@backend/features/billing/service/billing';

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

  const label = (pt: string, english: string) => (en ? english : pt);
  const list = <T>(items: T[], render: (item: T) => string, max: number) =>
    items.map(render).filter(Boolean).slice(0, max).join('; ');

  for (const section of content.sections) {
    switch (section.type) {
      case 'hero':
        if (section.subtitle)
          lines.push(`${label('Resumo', 'Summary')}: ${cut(section.subtitle, 320)}`);
        if (section.primaryLabel)
          lines.push(
            `${label('Ação principal', 'Main action')}: ${cut(section.primaryLabel, 120)}`,
          );
        break;
      case 'about':
        if (section.title || section.body)
          lines.push(
            `${label('Sobre', 'About')}: ${cut([section.title, section.body].filter(Boolean).join(' — '), 700)}`,
          );
        break;
      case 'services': {
        const items = section.items.filter((item) => item.title);
        if (items.length)
          lines.push(
            `${label('Ofertas', 'Offerings')}: ` +
              list(
                items,
                (item) =>
                  cut(`${item.title}${item.description ? ` — ${item.description}` : ''}`, 240),
                12,
              ),
          );
        break;
      }
      case 'stats': {
        const items = section.items.filter((item) => item.value);
        if (items.length)
          lines.push(
            `${label('Números', 'Numbers')}: ` +
              list(items, (item) => cut(`${item.value} ${item.label}`, 120), 4),
          );
        break;
      }
      case 'steps': {
        const items = section.items.filter((item) => item.title);
        if (items.length)
          lines.push(
            `${label('Passos', 'Steps')}: ` +
              list(
                items,
                (item) =>
                  cut(`${item.title}${item.description ? ` — ${item.description}` : ''}`, 200),
                6,
              ),
          );
        break;
      }
      case 'experience': {
        const items = section.items.filter((item) => item.role);
        if (items.length)
          lines.push(
            `${label('Experiência', 'Experience')}: ` +
              list(
                items,
                (item) =>
                  cut(
                    [item.role, item.company, item.period, item.location, item.summary]
                      .filter(Boolean)
                      .join(' · '),
                    240,
                  ),
                10,
              ),
          );
        break;
      }
      case 'testimonials': {
        const items = section.items.filter((item) => item.quote);
        if (items.length)
          lines.push(
            `${label('Depoimentos', 'Testimonials')}: ` +
              list(
                items,
                (item) => cut(`"${item.quote}"${item.name ? ` — ${item.name}` : ''}`, 220),
                6,
              ),
          );
        break;
      }
      case 'faq': {
        const items = section.items.filter((item) => item.question);
        if (items.length)
          lines.push(
            `${label('Perguntas frequentes', 'FAQ')}: ` +
              list(items, (item) => cut(`${item.question} — ${item.answer}`, 280), 10),
          );
        break;
      }
      case 'video':
        if (section.url) lines.push(`${label('Vídeo', 'Video')}: ${cut(section.url, 160)}`);
        break;
      case 'map':
        if (section.address)
          lines.push(`${label('Endereço', 'Address')}: ${cut(section.address, 200)}`);
        break;
      case 'contact':
        if (section.primaryLabel)
          lines.push(
            `${label('Ação de contato', 'Contact action')}: ${cut(section.primaryLabel, 120)}`,
          );
        break;
      case 'footer':
        if (section.text) lines.push(`${label('Rodapé', 'Footer')}: ${cut(section.text, 220)}`);
        break;
      default:
        break;
    }
  }

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
        'What it is: a platform to create, edit and publish pages without code, with a personal AI assistant included.',
        'Main features: pages assembled from editable blocks (hero, about, services, gallery, numbers, steps, experience, testimonials, FAQ, video, map, contact and footer), each with style variants; live editing of texts, images, logo, colors and font; publishing on a free Vira subdomain or on the customer own domain; image uploads; basic analytics; installable PWA; and a personal AI assistant, on by default, that answers visitor questions using the content stored for that site.',
        'How it works: sign in with email and password, a code or Google; the account starts with a ready page and address; add, remove and reorder blocks and publish in the dashboard.',
        'Trial and plans: one day free without a card; then Monthly or Yearly.',
        priceNote,
        'The AI assistant answers simple questions about the business using only the content the owner filled in, and is available to every account with active access.',
      ].join('\n')
    : [
        'Nome: Vira (vira.ia.br)',
        'O que é: uma plataforma para criar, editar e publicar páginas sem programar, com uma assistente de IA própria incluída.',
        'Principais recursos: páginas montadas com blocos editáveis (herói, sobre, serviços, galeria, números, passos, experiência, depoimentos, perguntas frequentes, vídeo, mapa, contato e rodapé), cada um com variações de estilo; edição ao vivo de textos, imagens, logo, cores e fonte; publicação em subdomínio Vira gratuito ou em domínio próprio; envio de imagens; estatísticas básicas; PWA instalável; e uma assistente de IA, ligada por padrão, que responde perguntas dos visitantes usando o conteúdo cadastrado daquela página.',
        'Como funciona: entre com e-mail e senha, código ou Google; a conta já começa com uma página e um endereço prontos; adicione, remova e reordene blocos e publique no painel.',
        'Teste e planos: um dia grátis sem cartão; depois Mensal ou Anual.',
        priceNote,
        'A assistente de IA responde perguntas simples sobre o negócio usando apenas o conteúdo preenchido pelo responsável e fica disponível para toda conta com acesso ativo.',
      ].join('\n');
}
