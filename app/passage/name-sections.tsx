import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  PassageTaskProgress,
  PassageVerseList,
  SelectionConfirmBar,
  TextField,
} from '@/components';
import { colors, sectionColorMuted } from '@/constants/tokens';
import { usePassages } from '@/hooks/usePassages';
import {
  firstUnnamedSectionIndex,
  formatPassageReference,
  normalizeSectionTitle,
  verseRefKey,
  type PassageRecord,
  type PassageVerse,
  type Section,
  type VerseSelectionRef,
} from '@/lib/storage';

const PASSAGE_TASK_STEPS = [
  { key: 'select_passage', label: 'Select' },
  { key: 'divide_sections', label: 'Divide' },
  { key: 'name_sections', label: 'Name' },
];

function sectionVersesFor(
  record: PassageRecord,
  section: Section,
): PassageVerse[] {
  const verseById = new Map(record.verses.map((verse) => [verse.id, verse]));
  return record.sectionVerses
    .filter((link) => link.sectionId === section.id)
    .sort((a, b) => a.order - b.order)
    .map((link) => verseById.get(link.passageVerseId))
    .filter((verse): verse is PassageVerse => Boolean(verse));
}

function sectionReference(
  bookId: string,
  verses: PassageVerse[],
): string {
  const refs: VerseSelectionRef[] = verses.map((verse) => ({
    bookId,
    chapter: verse.chapter,
    verse: verse.verse,
  }));
  return formatPassageReference(refs);
}

export default function NameSectionsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ passageId?: string }>();
  const passageId = params.passageId ?? '';
  const { getRecord, saveSectionName, finishNamingSections } = usePassages();

  const [record, setRecord] = useState<PassageRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [draftTitle, setDraftTitle] = useState('');

  const orderedSections = useMemo(() => {
    if (!record) return [] as Section[];
    return [...record.sections].sort((a, b) => a.order - b.order);
  }, [record]);

  const skippedDivide = useMemo(() => {
    if (!record) return false;
    return record.verses.length <= 2;
  }, [record]);

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
        if (next.passage.currentTaskId !== 'name_sections') {
          router.replace('/(tabs)');
          return;
        }
        if (next.sections.length === 0) {
          Alert.alert('No sections', 'Divide this passage into sections first.', [
            { text: 'OK', onPress: () => router.replace('/(tabs)') },
          ]);
          return;
        }
        const startIndex = firstUnnamedSectionIndex(next.sections);
        const ordered = [...next.sections].sort((a, b) => a.order - b.order);
        setRecord(next);
        setSectionIndex(startIndex);
        setDraftTitle(ordered[startIndex]?.title ?? '');
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

  const currentSection = orderedSections[sectionIndex] ?? null;
  const currentVerses = useMemo(() => {
    if (!record || !currentSection) return [] as PassageVerse[];
    return sectionVersesFor(record, currentSection);
  }, [currentSection, record]);

  const highlightByKey = useMemo(() => {
    if (!record || !currentSection) return new Map<string, string>();
    const tint = sectionColorMuted(currentSection.colorKey);
    const map = new Map<string, string>();
    for (const verse of currentVerses) {
      map.set(verseRefKey({
        bookId: record.passage.bookId,
        chapter: verse.chapter,
        verse: verse.verse,
      }), tint);
    }
    return map;
  }, [currentSection, currentVerses, record]);

  const referencePreview = useMemo(() => {
    if (!record || currentVerses.length === 0) return undefined;
    return sectionReference(record.passage.bookId, currentVerses);
  }, [currentVerses, record]);

  const isLast = sectionIndex >= orderedSections.length - 1;
  const canContinue = normalizeSectionTitle(draftTitle).length > 0;

  const handleBack = useCallback(() => {
    if (sectionIndex > 0 && record) {
      const prevIndex = sectionIndex - 1;
      const prev = orderedSections[prevIndex];
      setSectionIndex(prevIndex);
      setDraftTitle(prev?.title ?? '');
      return;
    }
    router.replace('/(tabs)');
  }, [orderedSections, record, router, sectionIndex]);

  const handleContinue = useCallback(async () => {
    if (!record || !currentSection || !canContinue) return;
    setSaving(true);
    try {
      const updated = await saveSectionName(
        record.passage.id,
        currentSection.id,
        draftTitle,
      );
      setRecord(updated);

      if (isLast) {
        await finishNamingSections(record.passage.id);
        router.replace('/(tabs)');
        return;
      }

      const nextIndex = sectionIndex + 1;
      const nextSections = [...updated.sections].sort((a, b) => a.order - b.order);
      setSectionIndex(nextIndex);
      setDraftTitle(nextSections[nextIndex]?.title ?? '');
    } catch (err) {
      Alert.alert(
        'Could not save section name',
        err instanceof Error ? err.message : String(err),
      );
    } finally {
      setSaving(false);
    }
  }, [
    canContinue,
    currentSection,
    draftTitle,
    finishNamingSections,
    isLast,
    record,
    router,
    saveSectionName,
    sectionIndex,
  ]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  if (!record || !currentSection) {
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
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="flex-row items-center justify-between border-b border-border px-3 py-2">
          <Pressable onPress={handleBack} hitSlop={12} className="px-2 py-2">
            <Text className="text-base font-medium" style={{ color: colors.accent }}>
              Back
            </Text>
          </Pressable>
          <Text className="text-sm font-semibold text-primary" numberOfLines={1}>
            {record.passage.title}
          </Text>
          <View className="w-14" />
        </View>

        <PassageTaskProgress
          steps={PASSAGE_TASK_STEPS}
          currentIndex={2}
          skippedKeys={skippedDivide ? ['divide_sections'] : []}
        />

        <View className="border-b border-border px-5 py-4">
          <Text className="text-xs font-semibold uppercase tracking-wide text-secondary">
            Name sections · {sectionIndex + 1} of {orderedSections.length}
          </Text>
          <Text className="mt-2 text-base leading-6 text-primary">
            Read this section, then give it a short title that captures its theme or
            meaning.
          </Text>
          {referencePreview ? (
            <Text className="mt-2 text-sm font-medium text-secondary">
              {referencePreview}
            </Text>
          ) : null}
        </View>

        <View className="border-b border-border px-5 py-4">
          <TextField
            label="Section title"
            value={draftTitle}
            onChangeText={setDraftTitle}
            placeholder="e.g. God creates light"
            autoCapitalize="sentences"
            returnKeyType="done"
            maxLength={80}
          />
        </View>

        <PassageVerseList
          verses={currentVerses}
          bookId={record.passage.bookId}
          selectedKeys={new Set()}
          highlightByKey={highlightByKey}
          interactive={false}
          contentBottomPadding={140}
        />

        <SelectionConfirmBar
          count={currentVerses.length}
          countLabel={`Section ${sectionIndex + 1} of ${orderedSections.length}`}
          referencePreview={
            canContinue
              ? normalizeSectionTitle(draftTitle)
              : 'Enter a short title to continue'
          }
          confirmLabel={isLast ? 'Done' : 'Next'}
          alwaysVisible
          loading={saving}
          disabled={!canContinue}
          onConfirm={() => {
            void handleContinue();
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
