import type { PassageRecord, Section, SectionReadProgress } from '@/lib/storage/types';

export const READ_ROUND_COUNT = 5;

export function defaultReadProgress(sectionId: string): SectionReadProgress {
  return {
    sectionId,
    currentRound: 1,
    currentVerseIndex: 0,
    completedRounds: 0,
    completed: false,
  };
}

export function orderedSections(sections: Section[]): Section[] {
  return [...sections].sort((a, b) => a.order - b.order);
}

export function ensureAllReadProgress(
  sections: Section[],
  progress: SectionReadProgress[] | undefined,
): SectionReadProgress[] {
  const byId = new Map((progress ?? []).map((entry) => [entry.sectionId, entry]));
  return orderedSections(sections).map((section) => {
    const existing = byId.get(section.id);
    if (!existing) return defaultReadProgress(section.id);
    return {
      sectionId: section.id,
      currentRound: clamp(existing.currentRound, 1, READ_ROUND_COUNT),
      currentVerseIndex: Math.max(0, existing.currentVerseIndex),
      completedRounds: clamp(existing.completedRounds, 0, READ_ROUND_COUNT),
      completed: Boolean(existing.completed),
    };
  });
}

export function getReadProgress(
  progress: SectionReadProgress[],
  sectionId: string,
): SectionReadProgress {
  return progress.find((entry) => entry.sectionId === sectionId) ?? defaultReadProgress(sectionId);
}

export function firstIncompleteReadSectionIndex(
  sections: Section[],
  progress: SectionReadProgress[],
): number {
  const ordered = orderedSections(sections);
  if (ordered.length === 0) return 0;
  const index = ordered.findIndex((section) => !getReadProgress(progress, section.id).completed);
  return index >= 0 ? index : ordered.length - 1;
}

export function resolveActiveReadSectionId(
  record: Pick<PassageRecord, 'sections' | 'readProgress' | 'activeReadSectionId'>,
): string | undefined {
  const ordered = orderedSections(record.sections);
  if (ordered.length === 0) return undefined;

  const progress = ensureAllReadProgress(record.sections, record.readProgress);
  if (
    record.activeReadSectionId &&
    ordered.some((section) => section.id === record.activeReadSectionId)
  ) {
    return record.activeReadSectionId;
  }

  const incompleteIndex = firstIncompleteReadSectionIndex(record.sections, progress);
  return ordered[incompleteIndex]?.id;
}

export function sectionVerseCount(record: PassageRecord, sectionId: string): number {
  return record.sectionVerses.filter((link) => link.sectionId === sectionId).length;
}

export type ReadAdvanceResult =
  | { type: 'position'; progress: SectionReadProgress }
  | { type: 'section_complete'; progress: SectionReadProgress };

export function advanceRead(
  progress: SectionReadProgress,
  verseCount: number,
): ReadAdvanceResult {
  if (verseCount <= 0) {
    throw new Error('Section has no verses to read.');
  }

  const verseIndex = clamp(progress.currentVerseIndex, 0, verseCount - 1);
  const round = clamp(progress.currentRound, 1, READ_ROUND_COUNT);
  const isLastVerse = verseIndex >= verseCount - 1;

  if (!isLastVerse) {
    return {
      type: 'position',
      progress: {
        ...progress,
        currentRound: round,
        currentVerseIndex: verseIndex + 1,
        completed: false,
      },
    };
  }

  if (round < READ_ROUND_COUNT) {
    return {
      type: 'position',
      progress: {
        ...progress,
        currentRound: round + 1,
        currentVerseIndex: 0,
        completedRounds: round,
        completed: false,
      },
    };
  }

  return {
    type: 'section_complete',
    progress: {
      ...progress,
      currentRound: READ_ROUND_COUNT,
      currentVerseIndex: verseCount - 1,
      completedRounds: READ_ROUND_COUNT,
      completed: true,
    },
  };
}

export type ReadBackKind = 'previous_verse' | 'previous_section' | 'home';

/** What Back should do from the current read position. */
export function readBackKind(
  progress: SectionReadProgress,
  sectionIndex: number,
): ReadBackKind {
  const atSectionStart = progress.currentRound <= 1 && progress.currentVerseIndex <= 0;
  if (!atSectionStart) return 'previous_verse';
  if (sectionIndex > 0) return 'previous_section';
  return 'home';
}

export function retreatRead(
  progress: SectionReadProgress,
  verseCount: number,
): SectionReadProgress {
  if (verseCount <= 0) {
    throw new Error('Section has no verses to read.');
  }

  const verseIndex = clamp(progress.currentVerseIndex, 0, verseCount - 1);
  const round = clamp(progress.currentRound, 1, READ_ROUND_COUNT);

  if (verseIndex > 0) {
    return {
      ...progress,
      currentRound: round,
      currentVerseIndex: verseIndex - 1,
      completed: false,
    };
  }

  if (round <= 1) {
    return {
      ...progress,
      currentRound: 1,
      currentVerseIndex: 0,
      completedRounds: 0,
      completed: false,
    };
  }

  return {
    ...progress,
    currentRound: round - 1,
    currentVerseIndex: verseCount - 1,
    completedRounds: round - 2,
    completed: false,
  };
}

/** Position to land on when navigating back into a previous section. */
export function previousSectionReadLanding(
  progress: SectionReadProgress,
  verseCount: number,
): SectionReadProgress {
  if (verseCount <= 0) {
    throw new Error('Section has no verses to read.');
  }

  if (progress.completed) {
    return {
      ...progress,
      currentRound: READ_ROUND_COUNT,
      currentVerseIndex: verseCount - 1,
      completedRounds: READ_ROUND_COUNT,
      completed: true,
    };
  }

  return {
    ...progress,
    currentVerseIndex: clamp(progress.currentVerseIndex, 0, verseCount - 1),
    currentRound: clamp(progress.currentRound, 1, READ_ROUND_COUNT),
  };
}

export function confirmLabelForReadPosition(
  progress: SectionReadProgress,
  verseCount: number,
): 'Next verse' | 'Next round' | 'Continue' {
  const verseIndex = clamp(progress.currentVerseIndex, 0, Math.max(verseCount - 1, 0));
  const round = clamp(progress.currentRound, 1, READ_ROUND_COUNT);
  const isLastVerse = verseCount > 0 && verseIndex >= verseCount - 1;

  if (!isLastVerse) return 'Next verse';
  if (round < READ_ROUND_COUNT) return 'Next round';
  return 'Continue';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
