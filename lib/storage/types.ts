import type { PassageStatus } from '@/constants/tokens';

export type VerseSelectionRef = {
  bookId: string;
  chapter: number;
  verse: number;
};

export type Passage = {
  id: string;
  translationId: string;
  bookId: string;
  startChapter: number;
  startVerse: number;
  endChapter: number;
  endVerse: number;
  title: string;
  status: PassageStatus;
  currentTaskId: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
};

export type PassageVerse = {
  id: string;
  passageId: string;
  bibleVerseId: string;
  order: number;
  chapter: number;
  verse: number;
  text: string;
};

export type SectionStatus = 'in_progress' | 'completed';

export type Section = {
  id: string;
  passageId: string;
  title: string;
  order: number;
  colorKey: number;
  status: SectionStatus;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
};

export type SectionVerse = {
  id: string;
  sectionId: string;
  passageVerseId: string;
  order: number;
};

/** Input for persisting a section: ordered passage-verse ids. */
export type SectionDraft = {
  passageVerseIds: string[];
};

export type PassageRecord = {
  passage: Passage;
  verses: PassageVerse[];
  sections: Section[];
  sectionVerses: SectionVerse[];
};
