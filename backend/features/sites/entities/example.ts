import type { SiteContent } from './site';
import type { Section } from './sections';

/**
 * The single starting page every new account receives. Simple, black and white,
 * fully editable. There are no layout choices.
 */
export function exampleSections(language: 'pt' | 'en'): Section[] {
  const en = language === 'en';
  const c = (pt: string, english: string) => (en ? english : pt);
  return [
    {
      id: 'hero',
      type: 'hero',
      variant: 'center',
      eyebrow: c('BEM-VINDO', 'WELCOME'),
      title: c('Sua ideia, no ar.', 'Your idea, online.'),
      subtitle: c(
        'Apresente seu trabalho em uma página clara e convide as pessoas a entrar em contato.',
        'Present your work on a clear page and invite people to get in touch.',
      ),
      image: '',
      primaryLabel: c('Fale comigo', 'Get in touch'),
      primaryUrl: 'https://example.com/contato',
    },
    {
      id: 'about',
      type: 'about',
      variant: 'text',
      title: c('Sobre', 'About'),
      body: c(
        'Escreva aqui o que você faz, para quem e o que te diferencia.',
        'Write here what you do, for whom and what makes you different.',
      ),
      image: '',
    },
    {
      id: 'services',
      type: 'services',
      variant: 'cards',
      title: c('O que eu faço', 'What I do'),
      items: [
        {
          title: c('Serviço um', 'Service one'),
          description: c('Uma explicação curta e direta.', 'A short, direct explanation.'),
          image: '',
          url: '',
        },
        {
          title: c('Serviço dois', 'Service two'),
          description: c('Uma explicação curta e direta.', 'A short, direct explanation.'),
          image: '',
          url: '',
        },
        {
          title: c('Serviço três', 'Service three'),
          description: c('Uma explicação curta e direta.', 'A short, direct explanation.'),
          image: '',
          url: '',
        },
      ],
    },
    {
      id: 'steps',
      type: 'steps',
      variant: 'numbered',
      title: c('Como funciona', 'How it works'),
      items: [
        {
          title: c('Primeiro passo', 'First step'),
          description: c(
            'Explique o começo do seu processo.',
            'Describe the start of your process.',
          ),
        },
        {
          title: c('Segundo passo', 'Second step'),
          description: c(
            'Explique o meio do seu processo.',
            'Describe the middle of your process.',
          ),
        },
        {
          title: c('Terceiro passo', 'Third step'),
          description: c(
            'Explique a entrega do seu processo.',
            'Describe the delivery of your process.',
          ),
        },
      ],
    },
    {
      id: 'faq',
      type: 'faq',
      variant: 'accordion',
      title: c('Perguntas frequentes', 'Frequently asked questions'),
      items: [
        {
          question: c('Como começamos?', 'How do we start?'),
          answer: c(
            'Entre em contato para conversar sobre sua ideia.',
            'Get in touch to discuss your idea.',
          ),
        },
        {
          question: c('O atendimento é personalizado?', 'Is the service personalized?'),
          answer: c(
            'Sim. Adaptamos a proposta à sua necessidade.',
            'Yes. We adapt the proposal to your needs.',
          ),
        },
      ],
    },
    {
      id: 'contact',
      type: 'contact',
      variant: 'simple',
      title: c('Vamos conversar', 'Let’s talk'),
      body: c(
        'Conte o que você precisa e retornamos com os próximos passos.',
        'Tell us what you need and we will get back with next steps.',
      ),
      primaryLabel: c('Enviar mensagem', 'Send a message'),
      primaryUrl: 'https://example.com/contato',
      links: [{ label: 'Instagram', url: 'https://example.com/social' }],
    },
    {
      id: 'footer',
      type: 'footer',
      variant: 'simple',
      text: c('Feito com Vira.', 'Made with Vira.'),
      links: [{ label: c('Contato', 'Contact'), url: 'https://example.com/contato' }],
    },
  ];
}

export function exampleSite(language: 'pt' | 'en'): SiteContent {
  return {
    font: 'outfit',
    language,
    title: language === 'en' ? 'Your idea, online.' : 'Sua ideia, no ar.',
    appName: '',
    logo: '',
    showInShowcase: false,
    favicon: '',
    pwaIcon192: '',
    pwaIcon512: '',
    themeColor: '#ffffff',
    backgroundColor: '#ffffff',
    textColor: '#17130d',
    accentColor: '#17130d',
    assistant: true,
    sections: exampleSections(language),
  };
}
