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

export type PassageRecord = {
  passage: Passage;
  verses: PassageVerse[];
};
