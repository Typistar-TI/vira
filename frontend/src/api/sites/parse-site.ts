import { parseSite } from '@backend/features/sites/entities/site';
export const parseSiteContent = (value: unknown) => parseSite(value);
export type SiteContent = ReturnType<typeof parseSiteContent>;
export {
  fontHrefs,
  fontStacks,
  fontKeys,
  starterKeys,
  starterThemes,
  siteImages,
  siteProducts,
  sitePrimaryUrl,
} from '@backend/features/sites/entities/site';
export type { FontKey, StarterKey } from '@backend/features/sites/entities/site';
export {
  sectionTypes,
  sectionSchema,
  blankSection,
  embedUrl,
  MAX_SECTIONS,
} from '@backend/features/sites/entities/sections';
export type { Section, SectionType } from '@backend/features/sites/entities/sections';
export { starter, starterSite } from '@backend/features/sites/entities/starters';
export type { Starter } from '@backend/features/sites/entities/starters';
