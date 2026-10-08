import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PassageVerseList, SelectionConfirmBar } from '@/components';
import { colors, sectionColorMuted } from '@/constants/tokens';
import { usePassages } from '@/hooks/usePassages';
import {
  canOpenDivideScreen,
  canToggleVerseOrder,
  formatPassageReference,
  nextSectionColorKey,
  verseRefKey,
  type PassageRecord,
  type PassageVerse,
  type SectionDraft,
  type VerseSelectionRef,
} from '@/lib/storage';

type DraftSection = {
  passageVerseIds: string[];
  colorKey: number;
};

function refsFromPassageVerses(
  bookId: string,
  verses: PassageVerse[],
  ids: string[],
): VerseSelectionRef[] {
  const byId = new Map(verses.map((verse) => [verse.id, verse]));
  return ids
    .map((id) => byId.get(id))
    .filter((verse): verse is PassageVerse => Boolean(verse))
    .sort((a, b) => a.order - b.order)
    .map((verse) => ({
      bookId,
      chapter: verse.chapter,
      verse: verse.verse,
    }));
}

export default function DivideSectionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ passageId?: string }>();
  const passageId = params.passageId ?? '';
  const { getRecord, saveSections } = usePassages();

  const [record, setRecord] = useState<PassageRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draftSelection, setDraftSelection] = useState<string[]>([]);
  const [draftSections, setDraftSections] = useState<DraftSection[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!passageId) {
        setLoading(false);
        return;
      }
      try {
        const next = await getRecord(passageId);
        if (cancelled) return;
        if (!next) {
          Alert.alert('Passage not found', 'This passage could not be loaded.', [
            { text: 'OK', onPress: () => router.replace('/(tabs)') },
          ]);
          return;
        }
        if (
          !canOpenDivideScreen({
            currentTaskId: next.passage.currentTaskId,
            verseCount: next.verses.length,
          })
        ) {
          router.replace('/(tabs)');
          return;
        }
        setRecord(next);
      } catch (err) {
        if (!cancelled) {
          Alert.alert(
            'Could not load passage',
            err instanceof Error ? err.message : String(err),
            [{ text: 'OK', onPress: () => router.replace('/(tabs)') }],
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [getRecord, passageId, router]);

  const assignedIds = useMemo(() => {
    const ids = new Set<string>();
    for (const section of draftSections) {
      for (const id of section.passageVerseIds) ids.add(id);
    }
    return ids;
  }, [draftSections]);

  const allAssigned = useMemo(() => {
    if (!record) return false;
    return record.verses.every((verse) => assignedIds.has(verse.id));
  }, [assignedIds, record]);

  const verseById = useMemo(() => {
    if (!record) return new Map<string, PassageVerse>();
    return new Map(record.verses.map((verse) => [verse.id, verse]));
  }, [record]);

  const selectedKeys = useMemo(() => {
    if (!record) return new Set<string>();
    const keys = new Set<string>();
    for (const id of draftSelection) {
      const verse = verseById.get(id);
      if (verse) {
        keys.add(verseRefKey({ bookId: record.passage.bookId, chapter: verse.chapter, verse: verse.verse }));
      }
    }
    return keys;
  }, [draftSelection, record, verseById]);

  const highlightByKey = useMemo(() => {
    const map = new Map<string, string>();
    if (!record) return map;
    for (const section of draftSections) {
      const tint = sectionColorMuted(section.colorKey);
      for (const id of section.passageVerseIds) {
        const verse = verseById.get(id);
        if (verse) {
          map.set(
            verseRefKey({
              bookId: record.passage.bookId,
              chapter: verse.chapter,
              verse: verse.verse,
            }),
            tint,
          );
        }
      }
    }
    return map;
  }, [draftSections, record, verseById]);

  const selectionPreview = useMemo(() => {
    if (!record || draftSelection.length === 0) return undefined;
    return formatPassageReference(
      refsFromPassageVerses(record.passage.bookId, record.verses, draftSelection),
    );
  }, [draftSelection, record]);

  const handleToggleVerse = useCallback(
    (passageVerseId: string) => {
      if (!record) return;

      const verse = verseById.get(passageVerseId);
      if (!verse) return;

      const assigned = assignedIds.has(passageVerseId);
      const selectedOrders = draftSelection
        .map((id) => verseById.get(id)?.order)
        .filter((order): order is number => order !== undefined);

      const result = canToggleVerseOrder(selectedOrders, verse.order, assigned);
      if (!result.ok) {
        if (result.reason === 'assigned') {
          Alert.alert(
            'Already in a section',
            'Undo the last section if you want to reassign these verses.',
          );
        } else {
          Alert.alert(
            'Select contiguous verses',
            'Sections must stay a continuous group. Unselect from either end, or clear and reselect.',
          );
        }
        return;
      }

      setDraftSelection((prev) =>
        prev.includes(passageVerseId)
          ? prev.filter((id) => id !== passageVerseId)
          : [...prev, passageVerseId],
      );
    },
    [assignedIds, draftSelection, record, verseById],
  );

  const handleAddSection = useCallback(() => {
    if (draftSelection.length === 0) return;

    const colorKey = nextSectionColorKey(draftSections.length);
    const orderedIds = [...draftSelection].sort((a, b) => {
      const aOrder = verseById.get(a)?.order ?? 0;
      const bOrder = verseById.get(b)?.order ?? 0;
      return aOrder - bOrder;
    });

    setDraftSections((prev) => [
      ...prev,
      { passageVerseIds: orderedIds, colorKey },
    ]);
    setDraftSelection([]);
  }, [draftSelection, draftSections.length, verseById]);

  const handleUndoLastSection = useCallback(() => {
    setDraftSections((prev) => {
      if (prev.length === 0) return prev;
      return prev.slice(0, -1);
    });
  }, []);

  const handleContinue = useCallback(async () => {
    if (!record || !allAssigned) return;
    setSaving(true);
    try {
      const drafts: SectionDraft[] = draftSections.map((section) => ({
        passageVerseIds: section.passageVerseIds,
      }));
      await saveSections(record.passage.id, drafts);
      router.replace('/(tabs)');
    } catch (err) {
      Alert.alert(
        'Could not save sections',
        err instanceof Error ? err.message : String(err),
      );
    } finally {
      setSaving(false);
    }
  }, [allAssigned, draftSections, record, router, saveSections]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  if (!record) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="px-5 pt-4">
          <Pressable onPress={() => router.replace('/(tabs)')} hitSlop={12}>
            <Text className="text-base font-medium" style={{ color: colors.accent }}>
              Back
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between border-b border-border px-3 py-2">
        <Pressable
          onPress={() => router.replace('/(tabs)')}
          hitSlop={12}
          className="px-2 py-2">
          <Text className="text-base font-medium" style={{ color: colors.accent }}>
            Back
          </Text>
        </Pressable>
        <Text className="text-sm font-semibold text-primary" numberOfLines={1}>
          {record.passage.title}
        </Text>
        {draftSections.length > 0 ? (
          <Pressable onPress={handleUndoLastSection} hitSlop={12} className="px-2 py-2">
            <Text className="text-base font-medium" style={{ color: colors.accent }}>
              Undo
            </Text>
          </Pressable>
        ) : (
          <View className="w-14" />
        )}
      </View>

      <View className="border-b border-border px-5 py-4">
        <Text className="text-xs font-semibold uppercase tracking-wide text-secondary">
          Divide into sections
        </Text>
        <Text className="mt-2 text-base leading-6 text-primary">
          Tap verses to select a continuous chunk, then add it as a section. Each section gets
          its own color. If the passage is short, you can keep it as a single section.
        </Text>
        {draftSections.length > 0 ? (
          <Text className="mt-2 text-sm text-secondary">
            {draftSections.length} section{draftSections.length === 1 ? '' : 's'} created
            {allAssigned ? ' · ready to continue' : ''}
          </Text>
        ) : null}
      </View>

      <PassageVerseList
        verses={record.verses}
        bookId={record.passage.bookId}
        selectedKeys={selectedKeys}
        highlightByKey={highlightByKey}
        onToggleVerse={handleToggleVerse}
      />

      {allAssigned ? (
        <SelectionConfirmBar
          count={record.verses.length}
          countLabel={`${draftSections.length} section${draftSections.length === 1 ? '' : 's'}`}
          referencePreview="Ready for the next step"
          confirmLabel="Continue"
          alwaysVisible
          loading={saving}
          onConfirm={() => {
            void handleContinue();
          }}
        />
      ) : (
        <SelectionConfirmBar
          count={draftSelection.length}
          referencePreview={selectionPreview}
          confirmLabel="Add section"
          onConfirm={handleAddSection}
        />
      )}
    </SafeAreaView>
  );
}
