export type TranslationSourceType = 'local' | 'api';

export type BibleTranslation = {
  id: string;
  displayName: string;
  abbreviation: string;
  sourceType: TranslationSourceType;
  language: string;
  offlineAvailable: boolean;
  /** Short credit line for About / picker (required for copyrighted texts). */
  attribution?: string;
  /** Optional URL to link from attribution (e.g. NET → netbible.org). */
  attributionUrl?: string;
};

export const TRANSLATIONS: readonly BibleTranslation[] = [
  {
    id: 'net',
    displayName: 'NET Bible',
    abbreviation: 'NET',
    sourceType: 'local',
    language: 'en',
    offlineAvailable: true,
    attribution:
      'Scripture quoted by permission. Quotations designated (NET) are from the NET Bible® copyright ©1996, 2019 by Biblical Studies Press, L.L.C. http://netbible.com All rights reserved.',
    attributionUrl: 'https://netbible.org',
  },
  {
    id: 'kjv',
    displayName: 'King James Version',
    abbreviation: 'KJV',
    sourceType: 'local',
    language: 'en',
    offlineAvailable: true,
    attribution: 'Public domain (Oxford 1769 / Cambridge standard text).',
  },
] as const;

export function getTranslation(translationId: string): BibleTranslation | undefined {
  return TRANSLATIONS.find((translation) => translation.id === translationId);
}
