import type { Section } from './sections';
import { exampleSections } from './example';

type Lang = 'pt' | 'en';
type Translate = (pt: string, en: string) => string;

interface TemplateDefinition {
  key: string;
  name: { pt: string; en: string };
  description: { pt: string; en: string };
  build: (lang: Lang, t: Translate) => Section[];
}

const section = (type: string, fields: Record<string, unknown>): Section =>
  ({ id: type, type, ...fields }) as unknown as Section;

const pick = (sections: Section[], types: string[]): Section[] =>
  types
    .map((type) => sections.find((item) => item.type === type))
    .filter((item): item is Section => Boolean(item))
    .map((item) => structuredClone(item));

const link = (label: string) => [{ label, url: 'https://example.com/contato' }];

const definitions: TemplateDefinition[] = [
  {
    key: 'portfolio',
    name: { pt: 'Portfólio', en: 'Portfolio' },
    description: {
      pt: 'Mostre seu trabalho e convide para o contato.',
      en: 'Show your work and invite people to get in touch.',
    },
    build: (lang) =>
      pick(exampleSections(lang), ['hero', 'about', 'services', 'contact', 'footer']),
  },
  {
    key: 'local',
    name: { pt: 'Serviços locais', en: 'Local services' },
    description: {
      pt: 'Serviços, como funciona e perguntas frequentes.',
      en: 'Services, how it works and frequently asked questions.',
    },
    build: (lang) =>
      pick(exampleSections(lang), ['hero', 'services', 'steps', 'faq', 'contact', 'footer']),
  },
  {
    key: 'link',
    name: { pt: 'Link na bio', en: 'Link in bio' },
    description: {
      pt: 'Página curta com um botão principal.',
      en: 'A short page with one main button.',
    },
    build: (lang) => pick(exampleSections(lang), ['hero', 'contact', 'footer']),
  },
  {
    key: 'institucional',
    name: { pt: 'Institucional', en: 'Business' },
    description: {
      pt: 'Apresente a empresa, o processo e o contato.',
      en: 'Present the business, the process and the contact.',
    },
    build: (lang) =>
      pick(exampleSections(lang), ['hero', 'about', 'steps', 'faq', 'contact', 'footer']),
  },
  {
    key: 'restaurant',
    name: { pt: 'Restaurante', en: 'Restaurant' },
    description: {
      pt: 'Cardápio, avaliações e localização.',
      en: 'Menu, reviews and location.',
    },
    build: (_lang, t) => [
      section('hero', {
        variant: 'center',
        eyebrow: t('COZINHA ARTESANAL', 'HANDMADE FOOD'),
        title: t('Sabor que reúne.', 'Flavour that brings people together.'),
        subtitle: t(
          'Pratos preparados na hora, com ingredientes frescos e aquele toque da casa.',
          'Dishes made to order, with fresh ingredients and that homemade touch.',
        ),
        primaryLabel: t('Ver o cardápio', 'See the menu'),
        primaryUrl: 'https://example.com/contato',
      }),
      section('about', {
        variant: 'text',
        title: t('Nossa história', 'Our story'),
        body: t(
          'Conte como o restaurante começou, quem está à frente e o que torna a cozinha especial.',
          'Tell how the restaurant started, who is behind it and what makes the kitchen special.',
        ),
      }),
      section('services', {
        variant: 'cards',
        title: t('Destaques do cardápio', 'Menu highlights'),
        items: [
          {
            title: t('Prato da casa', 'Signature dish'),
            description: t(
              'Descreva o prato e os ingredientes.',
              'Describe the dish and ingredients.',
            ),
            image: '',
            url: '',
          },
          {
            title: t('Entrada', 'Starter'),
            description: t(
              'Descreva o prato e os ingredientes.',
              'Describe the dish and ingredients.',
            ),
            image: '',
            url: '',
          },
          {
            title: t('Sobremesa', 'Dessert'),
            description: t(
              'Descreva o prato e os ingredientes.',
              'Describe the dish and ingredients.',
            ),
            image: '',
            url: '',
          },
        ],
      }),
      section('stats', {
        variant: 'row',
        title: '',
        items: [
          { value: t('+10', '+10'), label: t('anos de casa', 'years open') },
          { value: '4.9', label: t('avaliação', 'rating') },
          { value: t('+50', '+50'), label: t('pratos', 'dishes') },
        ],
      }),
      section('testimonials', {
        variant: 'cards',
        title: t('O que dizem', 'What guests say'),
        items: [
          {
            quote: t(
              'Comida excelente e atendimento impecável.',
              'Excellent food and flawless service.',
            ),
            name: t('Cliente A', 'Guest A'),
          },
          {
            quote: t('Virou o meu lugar favorito.', 'It became my favourite spot.'),
            name: t('Cliente B', 'Guest B'),
          },
        ],
      }),
      section('map', {
        variant: 'wide',
        title: t('Onde estamos', 'Where we are'),
        address: t('Rua Exemplo, 123', '123 Example Street'),
      }),
      section('contact', {
        variant: 'simple',
        title: t('Reserve sua mesa', 'Book your table'),
        body: t(
          'Fale com a gente para reservas e eventos.',
          'Get in touch for bookings and events.',
        ),
        primaryLabel: t('Reservar', 'Book now'),
        primaryUrl: 'https://example.com/contato',
        links: link('WhatsApp'),
      }),
      section('footer', {
        variant: 'simple',
        text: t('Feito com Vira.', 'Made with Vira.'),
        links: link(t('Contato', 'Contact')),
      }),
    ],
  },
  {
    key: 'health',
    name: { pt: 'Saúde', en: 'Health' },
    description: {
      pt: 'Atendimento, como funciona e perguntas frequentes.',
      en: 'Care, how it works and frequently asked questions.',
    },
    build: (_lang, t) => [
      section('hero', {
        variant: 'left',
        eyebrow: t('ATENDIMENTO HUMANIZADO', 'CARING SERVICE'),
        title: t('Cuidar de você, com atenção.', 'Care for you, with attention.'),
        subtitle: t(
          'Atendimento próximo, com escuta e um plano de cuidado feito para você.',
          'Close care, with listening and a plan made for you.',
        ),
        primaryLabel: t('Agendar consulta', 'Book a visit'),
        primaryUrl: 'https://example.com/contato',
      }),
      section('services', {
        variant: 'cards',
        title: t('Como podemos ajudar', 'How we can help'),
        items: [
          {
            title: t('Consulta', 'Consultation'),
            description: t(
              'Avaliação completa e individualizada.',
              'A complete, individual assessment.',
            ),
            image: '',
            url: '',
          },
          {
            title: t('Exames', 'Exams'),
            description: t(
              'Investigue com precisão e segurança.',
              'Investigate with precision and safety.',
            ),
            image: '',
            url: '',
          },
          {
            title: t('Acompanhamento', 'Follow-up'),
            description: t('Retornos para ajustar o cuidado.', 'Follow-ups to adjust the care.'),
            image: '',
            url: '',
          },
        ],
      }),
      section('steps', {
        variant: 'numbered',
        title: t('Como funciona', 'How it works'),
        items: [
          {
            title: t('Agende', 'Book'),
            description: t('Escolha o melhor horário.', 'Pick the best time.'),
          },
          {
            title: t('Atendimento', 'Visit'),
            description: t('Conversamos e avaliamos com calma.', 'We talk and assess with care.'),
          },
          {
            title: t('Acompanhamento', 'Follow-up'),
            description: t('Seguimos juntos no cuidado.', 'We keep going together.'),
          },
        ],
      }),
      section('stats', {
        variant: 'row',
        title: '',
        items: [
          { value: t('+15', '+15'), label: t('anos', 'years') },
          { value: t('+5.000', '+5,000'), label: t('atendimentos', 'visits') },
        ],
      }),
      section('faq', {
        variant: 'accordion',
        title: t('Perguntas frequentes', 'Frequently asked questions'),
        items: [
          {
            question: t('Como agendo?', 'How do I book?'),
            answer: t(
              'Use o botão de contato para falar com a gente.',
              'Use the contact button to reach us.',
            ),
          },
          {
            question: t('Atende convênio?', 'Do you take insurance?'),
            answer: t(
              'Explique as formas de pagamento e convênios.',
              'Explain payment methods and insurance.',
            ),
          },
        ],
      }),
      section('contact', {
        variant: 'simple',
        title: t('Agende sua consulta', 'Book your visit'),
        body: t(
          'Fale com a gente e escolha o melhor horário.',
          'Get in touch and pick the best time.',
        ),
        primaryLabel: t('Agendar', 'Book'),
        primaryUrl: 'https://example.com/contato',
        links: link('WhatsApp'),
      }),
      section('footer', {
        variant: 'simple',
        text: t('Feito com Vira.', 'Made with Vira.'),
        links: link(t('Contato', 'Contact')),
      }),
    ],
  },
  {
    key: 'events',
    name: { pt: 'Eventos', en: 'Events' },
    description: {
      pt: 'Apresente seus eventos e receba pedidos de orçamento.',
      en: 'Present your events and receive quote requests.',
    },
    build: (_lang, t) => [
      section('hero', {
        variant: 'center',
        eyebrow: t('EVENTOS', 'EVENTS'),
        title: t('Seu evento inesquecível.', 'Your unforgettable event.'),
        subtitle: t(
          'Organização completa, do primeiro rascunho à festa pronta para acontecer.',
          'Full planning, from the first sketch to a party ready to happen.',
        ),
        primaryLabel: t('Solicitar orçamento', 'Request a quote'),
        primaryUrl: 'https://example.com/contato',
      }),
      section('about', {
        variant: 'text',
        title: t('O que fazemos', 'What we do'),
        body: t(
          'Descreva os tipos de evento que você organiza e o que está incluído.',
          'Describe the kinds of events you organise and what is included.',
        ),
      }),
      section('testimonials', {
        variant: 'cards',
        title: t('Quem confia', 'Who trusts us'),
        items: [
          {
            quote: t(
              'Cuidaram de tudo, foi perfeito.',
              'They took care of everything, it was perfect.',
            ),
            name: t('Cliente A', 'Client A'),
          },
          {
            quote: t('Profissionalismo do começo ao fim.', 'Professionalism from start to finish.'),
            name: t('Cliente B', 'Client B'),
          },
        ],
      }),
      section('faq', {
        variant: 'accordion',
        title: t('Perguntas frequentes', 'Frequently asked questions'),
        items: [
          {
            question: t('Com quanto tempo devo fechar?', 'How far ahead should I book?'),
            answer: t('Explique o prazo ideal para reservar.', 'Explain the ideal booking window.'),
          },
          {
            question: t('Vocês atendem fora da cidade?', 'Do you travel to other cities?'),
            answer: t('Diga sua área de atendimento.', 'State your service area.'),
          },
        ],
      }),
      section('contact', {
        variant: 'simple',
        title: t('Vamos planejar juntos', 'Let’s plan together'),
        body: t(
          'Conte sobre o seu evento e enviamos um orçamento.',
          'Tell us about your event and we will send a quote.',
        ),
        primaryLabel: t('Falar com a equipe', 'Talk to the team'),
        primaryUrl: 'https://example.com/contato',
        links: link('Instagram'),
      }),
      section('footer', {
        variant: 'simple',
        text: t('Feito com Vira.', 'Made with Vira.'),
        links: link(t('Contato', 'Contact')),
      }),
    ],
  },
  {
    key: 'blank',
    name: { pt: 'Em branco', en: 'Blank' },
    description: {
      pt: 'Comece do zero, só com o essencial.',
      en: 'Start from scratch, just the essentials.',
    },
    build: (lang) => pick(exampleSections(lang), ['hero', 'contact']),
  },
];

export interface SiteTemplate {
  key: string;
  name: string;
  description: string;
  sections: Section[];
}

/** Ready-made pages offered in the guided editor. */
export function siteTemplates(language: Lang): SiteTemplate[] {
  const t: Translate = (pt, en) => (language === 'en' ? en : pt);
  return definitions.map((definition) => ({
    key: definition.key,
    name: definition.name[language],
    description: definition.description[language],
    sections: definition.build(language, t),
  }));
}
