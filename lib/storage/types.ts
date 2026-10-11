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

/** Per-section progress for the Read Section task (5 rounds, one verse at a time). */
export type SectionReadProgress = {
  sectionId: string;
  /** Round currently being read (1–5). */
  currentRound: number;
  /** 0-based index into the section's ordered verses. */
  currentVerseIndex: number;
  /** How many rounds have been fully finished (0–5). */
  completedRounds: number;
  /** True after all five rounds are finished for this section. */
  completed: boolean;
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
  /** Read-task progress keyed by section; empty until naming completes. */
  readProgress: SectionReadProgress[];
  /** Section the user is currently reading; used for resume and back-across-sections. */
  activeReadSectionId?: string;
};
