import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Section } from '../types';
import {
  allSectionsNamed,
  assertNonEmptySectionTitle,
  firstUnnamedSectionIndex,
  normalizeSectionTitle,
} from '../sectionNaming';

function section(partial: Partial<Section> & Pick<Section, 'id' | 'order' | 'title'>): Section {
  return {
    passageId: 'passage_1',
    colorKey: 0,
    status: 'in_progress',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...partial,
  };
}

describe('sectionNaming', () => {
  it('normalizes and rejects empty titles', () => {
    assert.equal(normalizeSectionTitle('  Light  '), 'Light');
    assert.throws(() => assertNonEmptySectionTitle('   '), /Enter a name/);
    assert.equal(assertNonEmptySectionTitle(' Creation '), 'Creation');
  });

  it('finds the first unnamed section by order', () => {
    const sections = [
      section({ id: 's2', order: 1, title: '' }),
      section({ id: 's1', order: 0, title: 'Begin' }),
      section({ id: 's3', order: 2, title: '   ' }),
    ];
    assert.equal(firstUnnamedSectionIndex(sections), 1);
  });

  it('returns the last index when all sections are named', () => {
    const sections = [
      section({ id: 's1', order: 0, title: 'A' }),
      section({ id: 's2', order: 1, title: 'B' }),
    ];
    assert.equal(firstUnnamedSectionIndex(sections), 1);
  });

  it('checks whether every section has a title', () => {
    assert.equal(allSectionsNamed([]), false);
    assert.equal(
      allSectionsNamed([section({ id: 's1', order: 0, title: 'Named' })]),
      true,
    );
    assert.equal(
      allSectionsNamed([
        section({ id: 's1', order: 0, title: 'Named' }),
        section({ id: 's2', order: 1, title: '  ' }),
      ]),
      false,
    );
  });
});
