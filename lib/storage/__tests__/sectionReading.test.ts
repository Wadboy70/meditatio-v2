import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  READ_ROUND_COUNT,
  advanceRead,
  confirmLabelForReadPosition,
  defaultReadProgress,
  firstIncompleteReadSectionIndex,
  previousSectionReadLanding,
  readBackKind,
  resolveActiveReadSectionId,
  retreatRead,
} from '../sectionReading';
import type { PassageRecord, Section, SectionReadProgress } from '../types';

function section(partial: Partial<Section> & Pick<Section, 'id' | 'order'>): Section {
  return {
    passageId: 'passage_1',
    title: 'Title',
    colorKey: 0,
    status: 'in_progress',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...partial,
  };
}

describe('sectionReading', () => {
  it('advances verse then round then completes', () => {
    let progress = defaultReadProgress('s1');
    let result = advanceRead(progress, 2);
    assert.equal(result.type, 'position');
    progress = result.progress;
    assert.equal(progress.currentVerseIndex, 1);
    assert.equal(confirmLabelForReadPosition(progress, 2), 'Next round');

    result = advanceRead(progress, 2);
    assert.equal(result.type, 'position');
    progress = result.progress;
    assert.equal(progress.currentRound, 2);
    assert.equal(progress.currentVerseIndex, 0);
    assert.equal(progress.completedRounds, 1);

    for (let round = 2; round < READ_ROUND_COUNT; round += 1) {
      result = advanceRead(progress, 2);
      progress = result.progress;
      result = advanceRead(progress, 2);
      progress = result.progress;
    }

    // Last verse of round 5
    result = advanceRead(progress, 2);
    progress = result.progress;
    assert.equal(progress.currentRound, READ_ROUND_COUNT);
    assert.equal(progress.currentVerseIndex, 1);
    assert.equal(confirmLabelForReadPosition(progress, 2), 'Continue');

    result = advanceRead(progress, 2);
    assert.equal(result.type, 'section_complete');
    assert.equal(result.progress.completed, true);
    assert.equal(result.progress.completedRounds, READ_ROUND_COUNT);
  });

  it('retreats across verses and rounds', () => {
    let progress: SectionReadProgress = {
      sectionId: 's1',
      currentRound: 2,
      currentVerseIndex: 0,
      completedRounds: 1,
      completed: false,
    };
    progress = retreatRead(progress, 3);
    assert.equal(progress.currentRound, 1);
    assert.equal(progress.currentVerseIndex, 2);
    assert.equal(progress.completedRounds, 0);

    progress = retreatRead(progress, 3);
    assert.equal(progress.currentVerseIndex, 1);

    assert.equal(readBackKind(defaultReadProgress('s1'), 0), 'home');
    assert.equal(readBackKind(defaultReadProgress('s1'), 1), 'previous_section');
    assert.equal(
      readBackKind(
        { sectionId: 's1', currentRound: 1, currentVerseIndex: 1, completedRounds: 0, completed: false },
        0,
      ),
      'previous_verse',
    );
  });

  it('resolves active and incomplete sections', () => {
    const sections = [
      section({ id: 's1', order: 0 }),
      section({ id: 's2', order: 1 }),
    ];
    const progress: SectionReadProgress[] = [
      {
        sectionId: 's1',
        currentRound: 5,
        currentVerseIndex: 0,
        completedRounds: 5,
        completed: true,
      },
      defaultReadProgress('s2'),
    ];
    assert.equal(firstIncompleteReadSectionIndex(sections, progress), 1);

    const record = {
      sections,
      readProgress: progress,
      activeReadSectionId: 's1',
    } as Pick<PassageRecord, 'sections' | 'readProgress' | 'activeReadSectionId'>;
    assert.equal(resolveActiveReadSectionId(record), 's1');

    const landing = previousSectionReadLanding(progress[0], 4);
    assert.equal(landing.currentRound, READ_ROUND_COUNT);
    assert.equal(landing.currentVerseIndex, 3);
    assert.equal(landing.completed, true);
  });
});
