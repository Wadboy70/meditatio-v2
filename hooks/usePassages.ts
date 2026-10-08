import { useCallback, useEffect, useState } from 'react';

import {
  createPassageFromVerseRefs,
  getPassageRecord,
  listPassages,
  savePassageSections,
  type Passage,
  type PassageRecord,
  type SectionDraft,
  type VerseSelectionRef,
} from '@/lib/storage';

export function usePassages() {
  const [passages, setPassages] = useState<Passage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const next = await listPassages();
      setPassages(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createFromSelection = useCallback(
    async (
      translationId: string,
      bookId: string,
      refs: VerseSelectionRef[],
    ): Promise<PassageRecord> => {
      const record = await createPassageFromVerseRefs(translationId, bookId, refs);
      await refresh();
      return record;
    },
    [refresh],
  );

  const getRecord = useCallback(async (passageId: string): Promise<PassageRecord | null> => {
    return getPassageRecord(passageId);
  }, []);

  const saveSections = useCallback(
    async (passageId: string, drafts: SectionDraft[]): Promise<PassageRecord> => {
      const record = await savePassageSections(passageId, drafts);
      await refresh();
      return record;
    },
    [refresh],
  );

  return {
    passages,
    loading,
    error,
    refresh,
    createFromSelection,
    getRecord,
    saveSections,
  };
}
