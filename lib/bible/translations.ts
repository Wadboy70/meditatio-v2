export type TranslationSourceType = 'local' | 'api';

export type BibleTranslation = {
  id: string;
  displayName: string;
  abbreviation: string;
  sourceType: TranslationSourceType;
  language: string;
  offlineAvailable: boolean;
};

export const TRANSLATIONS: readonly BibleTranslation[] = [
  {
    id: 'net',
    displayName: 'NET Bible',
    abbreviation: 'NET',
    sourceType: 'local',
    language: 'en',
    offlineAvailable: true,
  },
  {
    id: 'kjv',
    displayName: 'King James Version',
    abbreviation: 'KJV',
    sourceType: 'local',
    language: 'en',
    offlineAvailable: false,
  },
] as const;

export function getTranslation(translationId: string): BibleTranslation | undefined {
  return TRANSLATIONS.find((translation) => translation.id === translationId);
}
