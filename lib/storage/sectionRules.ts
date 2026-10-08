import { sectionColors } from '@/constants/tokens';
import type { PassageVerse, SectionDraft } from '@/lib/storage/types';

export function shouldSkipDivide(verseCount: number): boolean {
  return verseCount <= 2;
}

export function taskIdAfterCreate(verseCount: number): 'name_sections' | 'divide_sections' {
  return shouldSkipDivide(verseCount) ? 'name_sections' : 'divide_sections';
}

export function isContiguousOrders(orders: number[]): boolean {
  if (orders.length <= 1) return true;
  const sorted = [...orders].sort((a, b) => a - b);
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i] !== sorted[i - 1] + 1) return false;
  }
  return true;
}

export type ToggleVerseOrderResult =
  | { ok: true }
  | { ok: false; reason: 'assigned' | 'non_contiguous' };

/**
 * Whether toggling `candidateOrder` in/out of the current selection keeps
 * a contiguous run. End removals are allowed; middle removals are not.
 */
export function canToggleVerseOrder(
  selectedOrders: number[],
  candidateOrder: number,
  assigned: boolean,
): ToggleVerseOrderResult {
  if (assigned) {
    return { ok: false, reason: 'assigned' };
  }

  if (selectedOrders.includes(candidateOrder)) {
    const remaining = selectedOrders.filter((order) => order !== candidateOrder);
    if (!isContiguousOrders(remaining)) {
      return { ok: false, reason: 'non_contiguous' };
    }
    return { ok: true };
  }

  if (!isContiguousOrders([...selectedOrders, candidateOrder])) {
    return { ok: false, reason: 'non_contiguous' };
  }

  return { ok: true };
}

export function validateSectionDrafts(
  verses: PassageVerse[],
  drafts: SectionDraft[],
): void {
  if (drafts.length === 0) {
    throw new Error('Add at least one section before continuing.');
  }

  const verseById = new Map(verses.map((verse) => [verse.id, verse]));
  const assigned = new Set<string>();

  for (const draft of drafts) {
    if (draft.passageVerseIds.length === 0) {
      throw new Error('Each section must contain at least one verse.');
    }

    const orders: number[] = [];
    for (const passageVerseId of draft.passageVerseIds) {
      const verse = verseById.get(passageVerseId);
      if (!verse) {
        throw new Error(`Passage verse not found: ${passageVerseId}`);
      }
      if (assigned.has(passageVerseId)) {
        throw new Error('A verse can only belong to one section.');
      }
      assigned.add(passageVerseId);
      orders.push(verse.order);
    }

    if (!isContiguousOrders(orders)) {
      throw new Error('Section verses must be contiguous in the passage.');
    }
  }

  if (assigned.size !== verses.length) {
    throw new Error('Every verse in the passage must be assigned to a section.');
  }
}

export function nextSectionColorKey(index: number): number {
  return index % sectionColors.length;
}

export function canOpenDivideScreen(input: {
  currentTaskId: string;
  verseCount: number;
}): boolean {
  return input.currentTaskId === 'divide_sections' && !shouldSkipDivide(input.verseCount);
}

export function routeAfterCreate(currentTaskId: string): 'sections' | 'home' {
  return currentTaskId === 'divide_sections' ? 'sections' : 'home';
}
