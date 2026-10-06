import { starterThemes, type FontKey, type SiteContent, type StarterKey } from './site';
import type { Section } from './sections';

export interface Starter {
  font: FontKey;
  colors: { backgroundColor: string; textColor: string; accentColor: string };
  sections: Section[];
}

type Copy = (pt: string, en: string) => string;
const item = (title: string, description: string) => ({
  title,
  description,
  image: '',
  url: 'https://example.com/contato',
});

function hero(eyebrow: string, title: string, subtitle: string, label: string): Section {
  return {
    id: 'hero',
    type: 'hero',
    variant: 'left',
    eyebrow,
    title,
    subtitle,
    image: '',
    primaryLabel: label,
    primaryUrl: 'https://example.com/contato',
  };
}

function contact(copy: Copy): Section {
  return {
    id: 'contact',
    type: 'contact',
    variant: 'simple',
    title: copy('Vamos conversar', 'Let’s talk'),
    body: copy(
      'Conte o que você precisa e retornamos com os próximos passos.',
      'Tell us what you need and we will get back with next steps.',
    ),
    primaryLabel: copy('Enviar mensagem', 'Send a message'),
    primaryUrl: 'https://example.com/contato',
    links: [{ label: 'Instagram', url: 'https://example.com/social' }],
  };
}

function footer(copy: Copy): Section {
  return {
    id: 'footer',
    type: 'footer',
    variant: 'simple',
    text: copy(
      'Seu próximo projeto começa com uma conversa.',
      'Your next project starts with a conversation.',
    ),
    links: [
      { label: copy('Contato', 'Contact'), url: 'https://example.com/contato' },
      { label: 'Instagram', url: 'https://example.com/social' },
    ],
  };
}

export function starter(key: StarterKey, language: 'pt' | 'en' = 'pt'): Starter {
  const en = language === 'en';
  const copy: Copy = (pt, english) => (en ? english : pt);
  const theme = starterThemes[key];
  const base = {
    font: theme.font,
    colors: {
      backgroundColor: theme.backgroundColor,
      textColor: theme.textColor,
      accentColor: theme.accentColor,
    },
  };

  switch (key) {
    case 'guardiao':
      return {
        ...base,
        sections: [
          hero(
            copy('MONITORAMENTO E CONTROLE INTELIGENTE', 'SMART MONITORING AND CONTROL'),
            copy(
              'Seu espaço avisa. Você fica no controle.',
              'Your space alerts you. You stay in control.',
            ),
            copy(
              'Acompanhe seus ambientes, organize alertas e controle seus dispositivos em uma plataforma simples e segura.',
              'Monitor your spaces, organize alerts and control your devices in a simple, secure platform.',
            ),
            copy('Começar agora', 'Get started'),
          ),
          {
            id: 'stats',
            type: 'stats',
            variant: 'row',
            title: '',
            items: [
              { value: '24/7', label: copy('Disponível', 'Available') },
              { value: '100%', label: copy('Seu controle', 'Your control') },
            ],
          },
          {
            id: 'services',
            type: 'services',
            variant: 'cards',
            title: copy('O que você acompanha', 'What you track'),
            items: [
              item(
                copy('Visão geral', 'Overview'),
                copy('Todos os ambientes em um só lugar.', 'All spaces in one place.'),
              ),
              item(
                copy('Alertas', 'Alerts'),
                copy('Saiba o que acontece na hora certa.', 'Know what happens at the right time.'),
              ),
              item(
                copy('Automação', 'Automation'),
                copy('Uma rotina mais simples e conectada.', 'A simpler, connected routine.'),
              ),
            ],
          },
          {
            id: 'steps',
            type: 'steps',
            variant: 'numbered',
            title: copy('Como funciona', 'How it works'),
            items: [
              {
                title: copy('Conecte', 'Connect'),
                description: copy(
                  'Adicione seus dispositivos em minutos.',
                  'Add your devices in minutes.',
                ),
              },
              {
                title: copy('Organize', 'Organize'),
                description: copy(
                  'Defina alertas e rotinas do seu jeito.',
                  'Set alerts and routines your way.',
                ),
              },
              {
                title: copy('Acompanhe', 'Track'),
                description: copy(
                  'Veja tudo em um painel claro.',
                  'See everything in a clear dashboard.',
                ),
              },
            ],
          },
          {
            id: 'testimonials',
            type: 'testimonials',
            variant: 'cards',
            title: '',
            items: [
              {
                quote: copy(
                  'Ganhei tranquilidade no dia a dia.',
                  'I gained peace of mind every day.',
                ),
                name: copy('Cliente exemplo', 'Sample customer'),
              },
            ],
          },
          contact(copy),
          footer(copy),
        ],
      };
    case 'central':
      return {
        ...base,
        sections: [
          hero(
            copy('MULTIUSUÁRIO · ORGANIZADO · DO SEU JEITO', 'MULTI-USER · ORGANIZED · YOUR WAY'),
            copy('Seu trabalho, em uma única superfície.', 'Your work, in one unified workspace.'),
            copy(
              'Reúna serviços, métricas e atalhos em um espaço pessoal que você controla por inteiro.',
              'Bring services, metrics and shortcuts into a personal workspace you fully control.',
            ),
            copy('Ver como começar', 'See how to start'),
          ),
          {
            id: 'stats',
            type: 'stats',
            variant: 'grid',
            title: '',
            items: [
              { value: '18%', label: copy('Processamento', 'Processing') },
              { value: '42%', label: copy('Memória', 'Memory') },
              { value: '84.2', label: copy('Atividade', 'Activity') },
              { value: '4', label: copy('Serviços', 'Services') },
            ],
          },
          {
            id: 'services',
            type: 'services',
            variant: 'list',
            title: copy('Tudo em um lugar', 'Everything in one place'),
            items: [
              item(
                copy('Projetos', 'Projects'),
                copy('Organize entregas e prioridades.', 'Organize deliveries and priorities.'),
              ),
              item(
                copy('Arquivos', 'Files'),
                copy('Encontre tudo que precisa.', 'Find everything you need.'),
              ),
              item(
                copy('Relatórios', 'Reports'),
                copy('Acompanhe seus resultados.', 'Track your results.'),
              ),
              item(
                copy('Equipe', 'Team'),
                copy('Trabalhe melhor em conjunto.', 'Work better together.'),
              ),
            ],
          },
          {
            id: 'steps',
            type: 'steps',
            variant: 'cards',
            title: copy('Comece em três passos', 'Start in three steps'),
            items: [
              {
                title: copy('Crie sua conta', 'Create your account'),
                description: copy('Sem cartão, em um minuto.', 'No card, in a minute.'),
              },
              {
                title: copy('Escolha seus serviços', 'Pick your services'),
                description: copy('Monte seu espaço do seu jeito.', 'Build your space your way.'),
              },
              {
                title: copy('Acompanhe tudo', 'Track everything'),
                description: copy(
                  'Métricas e atalhos em um painel.',
                  'Metrics and shortcuts in one dashboard.',
                ),
              },
            ],
          },
          {
            id: 'faq',
            type: 'faq',
            variant: 'accordion',
            title: copy('Perguntas frequentes', 'Frequently asked questions'),
            items: [
              {
                question: copy('Preciso saber programar?', 'Do I need to code?'),
                answer: copy(
                  'Não. Tudo é configurado pela interface.',
                  'No. Everything is set up in the interface.',
                ),
              },
              {
                question: copy('Posso usar no celular?', 'Can I use it on mobile?'),
                answer: copy(
                  'Sim, funciona em qualquer dispositivo.',
                  'Yes, it works on any device.',
                ),
              },
            ],
          },
          contact(copy),
          footer(copy),
        ],
      };
    case 'perfil':
      return {
        ...base,
        sections: [
          hero(
            copy('DESIGNER E PROFISSIONAL CRIATIVO', 'DESIGNER AND CREATIVE PROFESSIONAL'),
            'Alex Silva',
            copy(
              'Projetos com foco em estratégia, experiência e atenção aos detalhes.',
              'Projects focused on strategy, experience and attention to detail.',
            ),
            copy('Vamos conversar', 'Let’s talk'),
          ),
          {
            id: 'about',
            type: 'about',
            variant: 'text',
            title: copy('Perfil profissional', 'Professional profile'),
            body: copy(
              'Experiência, formação e competências reunidas em uma página. Transformo ideias em experiências claras e úteis.',
              'Experience, education and skills in one place. I turn ideas into clear, useful experiences.',
            ),
            image: '',
          },
          {
            id: 'experience',
            type: 'experience',
            variant: 'timeline',
            title: copy('Experiência', 'Experience'),
            items: [
              {
                role: copy('Designer de produto', 'Product designer'),
                company: copy('Empresa exemplo', 'Sample company'),
                period: copy('2024 — atual', '2024 — present'),
                location: copy('Remoto', 'Remote'),
                summary: copy(
                  'Criação de experiências digitais, da pesquisa à entrega.',
                  'Creating digital experiences, from research to delivery.',
                ),
              },
              {
                role: copy('Designer visual', 'Visual designer'),
                company: copy('Estúdio criativo', 'Creative studio'),
                period: '2022 — 2024',
                location: 'São Paulo',
                summary: copy(
                  'Identidade visual e comunicação para marcas.',
                  'Visual identity and communication for brands.',
                ),
              },
            ],
          },
          {
            id: 'services',
            type: 'services',
            variant: 'cards',
            title: copy('Projetos selecionados', 'Selected projects'),
            items: [
              item(
                copy('Projeto Aurora', 'Aurora project'),
                copy(
                  'Uma experiência digital simples e acolhedora.',
                  'A simple, welcoming digital experience.',
                ),
              ),
              item(
                copy('Projeto Horizonte', 'Horizon project'),
                copy(
                  'Estratégia e identidade para uma nova marca.',
                  'Strategy and identity for a new brand.',
                ),
              ),
              item(
                copy('Projeto Essência', 'Essence project'),
                copy('Uma plataforma pensada para pessoas.', 'A platform designed for people.'),
              ),
            ],
          },
          {
            id: 'testimonials',
            type: 'testimonials',
            variant: 'single',
            title: '',
            items: [
              {
                quote: copy(
                  'Trabalho cuidadoso e resultado que fez a diferença.',
                  'Thoughtful work and a result that made a difference.',
                ),
                name: copy('Cliente exemplo', 'Sample customer'),
              },
            ],
          },
          contact(copy),
          footer(copy),
        ],
      };
    case 'estudio':
      return {
        ...base,
        sections: [
          hero(
            copy('ARTISTA E FOTÓGRAFA', 'ARTIST AND PHOTOGRAPHER'),
            'Marina Costa',
            copy(
              'COMPARTILHANDO OLHARES, HISTÓRIAS E NOVAS POSSIBILIDADES',
              'SHARING PERSPECTIVES, STORIES AND NEW POSSIBILITIES',
            ),
            copy('Ver perfil', 'View profile'),
          ),
          {
            id: 'stats',
            type: 'stats',
            variant: 'row',
            title: copy('Em números', 'In numbers'),
            items: [
              { value: '—', label: copy('Seguidores', 'Followers') },
              { value: '—', label: copy('Publicações', 'Posts') },
              { value: '—', label: copy('Interações recentes', 'Recent interactions') },
            ],
          },
          {
            id: 'about',
            type: 'about',
            variant: 'image-right',
            title: copy('Criadora da marca Essência', 'Founder of the Essence brand'),
            body: copy(
              'Arte e cuidado para acompanhar a beleza de cada história.',
              'Art and care to complement the beauty of every story.',
            ),
            image: '',
          },
          {
            id: 'gallery',
            type: 'gallery',
            variant: 'grid',
            title: copy('Galeria', 'Gallery'),
            images: [],
          },
          {
            id: 'services',
            type: 'services',
            variant: 'cards',
            title: copy('Serviços', 'Services'),
            items: [
              item(
                copy('Retratos', 'Portraits'),
                copy('Sua história em imagens.', 'Your story in pictures.'),
              ),
              item(
                copy('Artístico', 'Artistic'),
                copy('Expressão e criatividade.', 'Expression and creativity.'),
              ),
              item(
                copy('Marcas', 'Brands'),
                copy('Imagens com propósito.', 'Images with purpose.'),
              ),
            ],
          },
          contact(copy),
          footer(copy),
        ],
      };
    case 'blank':
      return {
        ...base,
        sections: [
          hero(
            copy('BEM-VINDO', 'WELCOME'),
            copy('Sua ideia, no ar.', 'Your idea, online.'),
            copy(
              'Apresente seu trabalho e convide as pessoas a entrar em contato.',
              'Introduce your work and invite people to get in touch.',
            ),
            copy('Fale comigo', 'Get in touch'),
          ),
          {
            id: 'about',
            type: 'about',
            variant: 'text',
            title: copy('Sobre', 'About'),
            body: copy(
              'Escreva aqui o que você faz, para quem e o que te diferencia.',
              'Write here what you do, for whom and what makes you different.',
            ),
            image: '',
          },
          contact(copy),
        ],
      };
    case 'classico':
    default:
      return {
        ...base,
        sections: [
          hero(
            copy('UM LUGAR CLARO PARA O QUE VOCÊ FAZ', 'A CLEAR PLACE FOR WHAT YOU DO'),
            copy(
              'Sua ideia pronta. Nossa equipe com você.',
              'Your idea ready. Our team by your side.',
            ),
            copy(
              'Conheça nossos serviços e tire suas dúvidas com a nossa assistente.',
              'Discover our services and ask our assistant your questions.',
            ),
            copy('Vamos conversar', 'Let’s talk'),
          ),
          {
            id: 'about',
            type: 'about',
            variant: 'text',
            title: copy('Seu projeto, do seu jeito.', 'Your project, your way.'),
            body: copy(
              'Um atendimento próximo, do primeiro contato até a entrega. Conte sua ideia e descubra como podemos ajudar.',
              'Personal service from first contact to delivery. Share your idea and discover how we can help.',
            ),
            image: '',
          },
          {
            id: 'services',
            type: 'services',
            variant: 'cards',
            title: copy('Serviços', 'Services'),
            items: [
              item(
                copy('Essencial', 'Essential'),
                copy(
                  'O primeiro passo para colocar sua ideia no mundo.',
                  'The first step to put your idea out there.',
                ),
              ),
              item(
                copy('Completo', 'Complete'),
                copy(
                  'Todos os detalhes para alcançar seu objetivo.',
                  'Every detail to achieve your goal.',
                ),
              ),
              item(
                copy('Sob medida', 'Custom'),
                copy(
                  'Uma proposta personalizada para sua necessidade.',
                  'A proposal personalized to your needs.',
                ),
              ),
            ],
          },
          {
            id: 'steps',
            type: 'steps',
            variant: 'numbered',
            title: copy('Como funciona', 'How it works'),
            items: [
              {
                title: copy('Conte sua ideia', 'Share your idea'),
                description: copy(
                  'Explique o que você precisa e o resultado que deseja.',
                  'Tell us what you need and the result you want.',
                ),
              },
              {
                title: copy('Planeje com a gente', 'Plan with us'),
                description: copy(
                  'Definimos uma proposta clara, com etapas e prazos.',
                  'We prepare a clear proposal with milestones.',
                ),
              },
              {
                title: copy('Veja acontecer', 'Make it happen'),
                description: copy(
                  'Acompanhe cada etapa e receba um resultado feito para você.',
                  'Follow every step and receive a result made for you.',
                ),
              },
            ],
          },
          {
            id: 'faq',
            type: 'faq',
            variant: 'accordion',
            title: copy('Perguntas frequentes', 'Frequently asked questions'),
            items: [
              {
                question: copy('Como começamos?', 'How do we start?'),
                answer: copy(
                  'Entre em contato para conversar sobre sua ideia.',
                  'Get in touch to discuss your idea.',
                ),
              },
              {
                question: copy('O atendimento é personalizado?', 'Is the service personalized?'),
                answer: copy(
                  'Sim. Adaptamos a proposta à sua necessidade.',
                  'Yes. We adapt the proposal to your needs.',
                ),
              },
            ],
          },
          {
            id: 'testimonials',
            type: 'testimonials',
            variant: 'cards',
            title: '',
            items: [
              {
                quote: copy(
                  'Um atendimento cuidadoso e um resultado que fez a diferença.',
                  'Thoughtful service and a result that made a difference.',
                ),
                name: copy('Cliente exemplo', 'Sample customer'),
              },
            ],
          },
          contact(copy),
          footer(copy),
        ],
      };
  }
}

export function starterSite(key: StarterKey, language: 'pt' | 'en'): SiteContent {
  const value = starter(key, language);
  return {
    font: value.font,
    language,
    title: value.sections.find((section) => section.type === 'hero')?.title || 'Vira',
    appName: '',
    logo: '',
    showInShowcase: false,
    favicon: '',
    pwaIcon192: '',
    pwaIcon512: '',
    themeColor: value.colors.backgroundColor,
    backgroundColor: value.colors.backgroundColor,
    textColor: value.colors.textColor,
    accentColor: value.colors.accentColor,
    assistant: true,
    sections: value.sections,
  };
}
