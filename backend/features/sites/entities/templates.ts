import type { Section } from './sections';
import { exampleSections } from './example';

interface TemplateDefinition {
  key: string;
  name: { pt: string; en: string };
  description: { pt: string; en: string };
  types: string[];
}

const definitions: TemplateDefinition[] = [
  {
    key: 'portfolio',
    name: { pt: 'Portfólio', en: 'Portfolio' },
    description: {
      pt: 'Mostre seu trabalho e convide para o contato.',
      en: 'Show your work and invite people to get in touch.',
    },
    types: ['hero', 'about', 'services', 'contact', 'footer'],
  },
  {
    key: 'local',
    name: { pt: 'Serviços locais', en: 'Local services' },
    description: {
      pt: 'Serviços, como funciona e perguntas frequentes.',
      en: 'Services, how it works and frequently asked questions.',
    },
    types: ['hero', 'services', 'steps', 'faq', 'contact', 'footer'],
  },
  {
    key: 'link',
    name: { pt: 'Link na bio', en: 'Link in bio' },
    description: {
      pt: 'Página curta com um botão principal.',
      en: 'A short page with one main button.',
    },
    types: ['hero', 'contact', 'footer'],
  },
  {
    key: 'institucional',
    name: { pt: 'Institucional', en: 'Business' },
    description: {
      pt: 'Apresente a empresa, o processo e o contato.',
      en: 'Present the business, the process and the contact.',
    },
    types: ['hero', 'about', 'steps', 'faq', 'contact', 'footer'],
  },
  {
    key: 'blank',
    name: { pt: 'Em branco', en: 'Blank' },
    description: {
      pt: 'Comece do zero, só com o essencial.',
      en: 'Start from scratch, just the essentials.',
    },
    types: ['hero', 'contact'],
  },
];

export interface SiteTemplate {
  key: string;
  name: string;
  description: string;
  sections: Section[];
}

/** Ready-made pages offered in the guided editor. */
export function siteTemplates(language: 'pt' | 'en'): SiteTemplate[] {
  const base = exampleSections(language);
  return definitions.map((definition) => ({
    key: definition.key,
    name: definition.name[language],
    description: definition.description[language],
    sections: definition.types
      .map((type) => base.find((section) => section.type === type))
      .filter((section): section is Section => Boolean(section))
      .map((section) => structuredClone(section)),
  }));
}
