import type { Section } from '@/lib/storage/types';

export function normalizeSectionTitle(title: string): string {
  return title.trim();
}

export function assertNonEmptySectionTitle(title: string): string {
  const trimmed = normalizeSectionTitle(title);
  if (!trimmed) {
    throw new Error('Enter a name for this section.');
  }
  return trimmed;
}

/** Index into sections sorted by `order` for the first untitled section. */
export function firstUnnamedSectionIndex(sections: Section[]): number {
  const ordered = [...sections].sort((a, b) => a.order - b.order);
  if (ordered.length === 0) return 0;
  const unnamed = ordered.findIndex((section) => !normalizeSectionTitle(section.title));
  return unnamed < 0 ? ordered.length - 1 : unnamed;
}

export function allSectionsNamed(sections: Section[]): boolean {
  return (
    sections.length > 0 &&
    sections.every((section) => normalizeSectionTitle(section.title).length > 0)
  );
}
