import {
  defaultSite,
  defaultLayoutColors,
  defaultLayoutFonts,
  type Layout,
  type SiteContent,
} from './site';

/** Editable example content, never source HTML, source assets or customer data. */
export function templatePreset(layout: Layout, language: 'pt' | 'en' = 'pt'): SiteContent {
  const en = language === 'en';
  const copy = (pt: string, english: string) => (en ? english : pt);
  const base: SiteContent = {
    ...structuredClone(defaultSite),
    layout,
    language,
    font: defaultLayoutFonts[layout],
    ...defaultLayoutColors[layout],
    themeColor: defaultLayoutColors[layout].backgroundColor,
    primaryLabel: copy('Vamos conversar', 'Let’s talk'),
    primaryUrl: 'https://example.com/contact',
    footerText: copy(
      'Seu próximo projeto começa com uma conversa.',
      'Your next project starts with a conversation.',
    ),
    links: [
      { label: 'Instagram', url: 'https://example.com/social' },
      { label: copy('Contato', 'Contact'), url: 'https://example.com/contact' },
    ],
    steps: [
      {
        title: copy('Conte sua ideia', 'Share your idea'),
        description: copy(
          'Explique o que você precisa e o resultado que deseja alcançar.',
          'Tell us what you need and the result you want to achieve.',
        ),
      },
      {
        title: copy('Planeje com a gente', 'Plan with us'),
        description: copy(
          'Definimos uma proposta clara, com etapas e prazos.',
          'We prepare a clear proposal with milestones and deadlines.',
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
    benefits: [
      {
        title: copy('Feito para você', 'Made for you'),
        description: copy(
          'Cada detalhe parte da sua necessidade, não de uma solução pronta.',
          'Every detail starts with your needs, not a one-size-fits-all solution.',
        ),
      },
      {
        title: copy('Tudo em um lugar', 'Everything in one place'),
        description: copy(
          'Informações, acompanhamento e suporte organizados com clareza.',
          'Information, progress and support organized clearly.',
        ),
      },
      {
        title: copy('Sem complicação', 'Keep it simple'),
        description: copy(
          'Um processo simples para você focar no que importa.',
          'A straightforward process so you can focus on what matters.',
        ),
      },
    ],
    testimonials: [
      {
        name: copy('Cliente exemplo', 'Sample customer'),
        quote: copy(
          'Um atendimento cuidadoso e um resultado que fez a diferença.',
          'Thoughtful service and a result that made a difference.',
        ),
      },
    ],
    faq: [
      {
        question: copy('Como começamos?', 'How do we start?'),
        answer: copy(
          'Entre em contato para conversar sobre sua ideia e receber uma proposta.',
          'Get in touch to discuss your idea and receive a proposal.',
        ),
      },
      {
        question: copy('O atendimento é personalizado?', 'Is the service personalized?'),
        answer: copy(
          'Sim. Adaptamos a proposta à sua necessidade e ao seu momento.',
          'Yes. We adapt the proposal to your needs and goals.',
        ),
      },
    ],
  };
  const product = (title: string, description: string) => ({
    title,
    description,
    image: '',
    url: 'https://example.com/services',
  });
  switch (layout) {
    case 'guardiao':
      return {
        ...base,
        appName: 'Nexo',
        eyebrow: copy('MONITORAMENTO E CONTROLE INTELIGENTE', 'SMART MONITORING AND CONTROL'),
        title: copy(
          'Seu espaço avisa. Você fica no controle.',
          'Your space alerts you. You stay in control.',
        ),
        subtitle: copy(
          'Acompanhe seus ambientes, organize alertas e controle seus dispositivos em uma plataforma simples, segura e feita para sua rotina.',
          'Monitor your spaces, organize alerts and control your devices in a simple, secure platform built for your daily life.',
        ),
        primaryLabel: copy('Começar agora', 'Get started'),
        aboutTitle: copy('Sua tranquilidade importa.', 'Your peace of mind matters.'),
        about: copy(
          'Tecnologia que trabalha em silêncio para você aproveitar seu dia. Reúna o que importa em um único painel.',
          'Technology that works quietly while you enjoy your day. Bring what matters into one dashboard.',
        ),
        stats: [
          { value: '24/7', label: copy('Disponível', 'Available') },
          { value: '100%', label: copy('Seu controle', 'Your control') },
        ],
        products: [
          product(
            copy('Visão geral', 'Overview'),
            copy('Todos os ambientes em um só lugar.', 'All spaces in one place.'),
          ),
          product(
            copy('Alertas', 'Alerts'),
            copy('Saiba o que acontece na hora certa.', 'Know what happens at the right time.'),
          ),
          product(
            copy('Automação', 'Automation'),
            copy('Uma rotina mais simples e conectada.', 'A simpler, connected routine.'),
          ),
        ],
      };
    case 'central':
      return {
        ...base,
        appName: 'Nexo+',
        eyebrow: copy(
          'MULTIUSUÁRIO · ORGANIZADO · DO SEU JEITO',
          'MULTI-USER · ORGANIZED · YOUR WAY',
        ),
        title: copy(
          'Seu trabalho, em uma única superfície.',
          'Your work, in one unified workspace.',
        ),
        subtitle: copy(
          'Reúna serviços, métricas e atalhos em um espaço pessoal que você controla por inteiro. Menos ruído, mais clareza para trabalhar.',
          'Bring services, metrics and shortcuts into a personal workspace you fully control. Less noise, more clarity for your work.',
        ),
        primaryLabel: copy('Ver como começar', 'See how to start'),
        aboutTitle: copy('Um espaço que funciona como você.', 'A workspace that works like you.'),
        about: copy(
          'Organize o que você usa todos os dias e acompanhe seus projetos sem perder o contexto.',
          'Organize what you use every day and follow your projects without losing context.',
        ),
        stats: [
          { value: '18%', label: copy('Processamento', 'Processing') },
          { value: '42%', label: copy('Memória', 'Memory') },
          { value: '84.2', label: copy('Atividade', 'Activity') },
          { value: '4', label: copy('Serviços', 'Services') },
        ],
        products: [
          product(
            copy('Projetos', 'Projects'),
            copy('Organize entregas e prioridades.', 'Organize deliveries and priorities.'),
          ),
          product(
            copy('Arquivos', 'Files'),
            copy('Encontre tudo que precisa.', 'Find everything you need.'),
          ),
          product(
            copy('Relatórios', 'Reports'),
            copy('Acompanhe seus resultados.', 'Track your results.'),
          ),
          product(
            copy('Equipe', 'Team'),
            copy('Trabalhe melhor em conjunto.', 'Work better together.'),
          ),
        ],
      };
    case 'perfil':
      return {
        ...base,
        appName: 'AS',
        title: 'Alex Silva',
        eyebrow: copy('Designer e profissional criativo', 'Designer and creative professional'),
        subtitle: copy(
          'Projetos com foco em estratégia, experiência e atenção aos detalhes.',
          'Projects focused on strategy, experience and attention to detail.',
        ),
        aboutTitle: copy('Perfil profissional', 'Professional profile'),
        about: copy(
          'Experiência, formação e competências reunidas em uma página. Transformo ideias em experiências claras e úteis.',
          'Experience, education and skills in one place. I turn ideas into clear, useful experiences.',
        ),
        stats: [
          { value: '3+', label: copy('anos de experiência', 'years of experience') },
          { value: '21', label: copy('projetos realizados', 'completed projects') },
        ],
        experience: [
          {
            role: copy('Designer de produto', 'Product designer'),
            company: copy('Empresa exemplo', 'Sample company'),
            period: '2024 — ' + copy('atual', 'present'),
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
            location: copy('São Paulo', 'São Paulo'),
            summary: copy(
              'Identidade visual e comunicação para marcas e projetos.',
              'Visual identity and communication for brands and projects.',
            ),
          },
        ],
        products: [
          product(
            copy('Projeto Aurora', 'Aurora project'),
            copy(
              'Uma experiência digital simples e acolhedora.',
              'A simple, welcoming digital experience.',
            ),
          ),
          product(
            copy('Projeto Horizonte', 'Horizon project'),
            copy(
              'Estratégia e identidade para uma nova marca.',
              'Strategy and identity for a new brand.',
            ),
          ),
          product(
            copy('Projeto Essência', 'Essence project'),
            copy('Uma plataforma pensada para pessoas.', 'A platform designed for people.'),
          ),
        ],
      };
    case 'estudio':
      return {
        ...base,
        appName: 'Marina Studio',
        title: 'Marina Costa',
        eyebrow: copy('ARTISTA E FOTÓGRAFA', 'ARTIST AND PHOTOGRAPHER'),
        subtitle: copy(
          'COMPARTILHANDO OLHARES, HISTÓRIAS E NOVAS POSSIBILIDADES',
          'SHARING PERSPECTIVES, STORIES AND NEW POSSIBILITIES',
        ),
        aboutTitle: copy('Criadora da marca Essência', 'Founder of the Essence brand'),
        about: copy(
          'Arte e cuidado para acompanhar a beleza de cada história.',
          'Art and care to complement the beauty of every story.',
        ),
        stats: [
          { value: '—', label: copy('Seguidores', 'Followers') },
          { value: '—', label: copy('Publicações', 'Posts') },
          { value: '—', label: copy('Visualizações recentes', 'Recent views') },
          { value: '—', label: copy('Interações recentes', 'Recent interactions') },
        ],
        products: [
          product(
            copy('Retratos', 'Portraits'),
            copy('Sua história em imagens.', 'Your story in pictures.'),
          ),
          product(
            copy('Artístico', 'Artistic'),
            copy('Expressão e criatividade.', 'Expression and creativity.'),
          ),
          product(copy('Marcas', 'Brands'), copy('Imagens com propósito.', 'Images with purpose.')),
        ],
      };
    case 'classico':
      return {
        ...base,
        appName: copy('Sua marca', 'Your brand'),
        title: copy(
          'Sua ideia pronta. Nossa equipe com você.',
          'Your idea ready. Our team by your side.',
        ),
        eyebrow: copy('UM LUGAR CLARO PARA O QUE VOCÊ FAZ', 'A CLEAR PLACE FOR WHAT YOU DO'),
        subtitle: copy(
          'Conheça nossos serviços e tire suas dúvidas com a nossa assistente. Experimente uma conversa abaixo.',
          'Discover our services and ask our assistant your questions. Try a conversation below.',
        ),
        aboutTitle: copy('Seu projeto, do seu jeito.', 'Your project, your way.'),
        about: copy(
          'Um atendimento próximo, do primeiro contato até a entrega. Conte sua ideia e descubra como podemos ajudar.',
          'Personal service from first contact to delivery. Share your idea and discover how we can help.',
        ),
        products: [
          product(
            copy('Essencial', 'Essential'),
            copy(
              'O primeiro passo para colocar sua ideia no mundo.',
              'The first step to put your idea out there.',
            ),
          ),
          product(
            copy('Completo', 'Complete'),
            copy(
              'Todos os detalhes para alcançar seu objetivo.',
              'Every detail to achieve your goal.',
            ),
          ),
          product(
            copy('Sob medida', 'Custom'),
            copy(
              'Uma proposta personalizada para sua necessidade.',
              'A proposal personalized to your needs.',
            ),
          ),
        ],
      };
  }
}
