import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  PassageTaskProgress,
  SelectionConfirmBar,
  VerseBlock,
} from '@/components';
import { colors, layout, sectionColorMuted, sectionColors } from '@/constants/tokens';
import { usePassages } from '@/hooks/usePassages';
import {
  READ_ROUND_COUNT,
  confirmLabelForReadPosition,
  ensureAllReadProgress,
  formatPassageReference,
  getReadProgress,
  orderedSections,
  readBackKind,
  resolveActiveReadSectionId,
  sectionVerseCount,
  type PassageRecord,
  type PassageVerse,
  type Section,
  type VerseSelectionRef,
} from '@/lib/storage';

const SECTION_TASK_STEPS = [
  { key: 'read_section', label: 'Read' },
  { key: 'word_recall', label: 'Recall' },
  { key: 'review_stuck_words', label: 'Stuck' },
  { key: 'build_acronym', label: 'Acronym' },
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

function sectionReference(bookId: string, verses: PassageVerse[]): string {
  const refs: VerseSelectionRef[] = verses.map((verse) => ({
    bookId,
    chapter: verse.chapter,
    verse: verse.verse,
  }));
  return formatPassageReference(refs);
}

export default function ReadSectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ passageId?: string }>();
  const passageId = params.passageId ?? '';
  const { getRecord, advanceRead, retreatRead, goToPreviousSectionRead } = usePassages();

  const [record, setRecord] = useState<PassageRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        if (next.passage.currentTaskId !== 'read_section') {
          router.replace('/(tabs)');
          return;
        }
        if (next.sections.length === 0) {
          Alert.alert('No sections', 'Divide this passage into sections first.', [
            { text: 'OK', onPress: () => router.replace('/(tabs)') },
          ]);
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

  const sections = useMemo(
    () => (record ? orderedSections(record.sections) : []),
    [record],
  );

  const readProgress = useMemo(
    () => (record ? ensureAllReadProgress(record.sections, record.readProgress) : []),
    [record],
  );

  const activeSectionId = useMemo(
    () => (record ? resolveActiveReadSectionId(record) : undefined),
    [record],
  );

  const currentSection = useMemo(() => {
    if (!activeSectionId) return null;
    return sections.find((section) => section.id === activeSectionId) ?? null;
  }, [activeSectionId, sections]);

  const sectionIndex = useMemo(() => {
    if (!currentSection) return 0;
    return Math.max(
      0,
      sections.findIndex((section) => section.id === currentSection.id),
    );
  }, [currentSection, sections]);

  const currentVerses = useMemo(() => {
    if (!record || !currentSection) return [] as PassageVerse[];
    return sectionVersesFor(record, currentSection);
  }, [currentSection, record]);

  const progress = useMemo(() => {
    if (!currentSection) return null;
    return getReadProgress(readProgress, currentSection.id);
  }, [currentSection, readProgress]);

  const currentVerse = useMemo(() => {
    if (!progress || currentVerses.length === 0) return null;
    const index = Math.min(
      Math.max(progress.currentVerseIndex, 0),
      currentVerses.length - 1,
    );
    return currentVerses[index] ?? null;
  }, [currentVerses, progress]);

  const confirmLabel = useMemo(() => {
    if (!progress) return 'Next verse';
    return confirmLabelForReadPosition(progress, currentVerses.length);
  }, [currentVerses.length, progress]);

  const referencePreview = useMemo(() => {
    if (!record || !currentVerse) return undefined;
    return sectionReference(record.passage.bookId, [currentVerse]);
  }, [currentVerse, record]);

  const sectionTint = currentSection
    ? sectionColorMuted(currentSection.colorKey)
    : undefined;
  const sectionAccent = currentSection
    ? sectionColors[currentSection.colorKey % sectionColors.length]
    : colors.accent;

  const applyRecord = useCallback((next: PassageRecord) => {
    if (next.passage.currentTaskId !== 'read_section') {
      router.replace('/(tabs)');
      return;
    }
    setRecord(next);
  }, [router]);

  const handleContinue = useCallback(async () => {
    if (!record || !currentSection || saving) return;
    setSaving(true);
    try {
      const updated = await advanceRead(record.passage.id, currentSection.id);
      applyRecord(updated);
    } catch (err) {
      Alert.alert(
        'Could not save progress',
        err instanceof Error ? err.message : String(err),
      );
    } finally {
      setSaving(false);
    }
  }, [advanceRead, applyRecord, currentSection, record, saving]);

  const handleBack = useCallback(() => {
    if (!record || !currentSection || !progress || saving) return;

    const kind = readBackKind(progress, sectionIndex);

    if (kind === 'home') {
      router.replace('/(tabs)');
      return;
    }

    if (kind === 'previous_verse') {
      Alert.alert(
        'Go to previous verse?',
        'You will move back to the previous verse in this section.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Go back',
            onPress: () => {
              void (async () => {
                setSaving(true);
                try {
                  const updated = await retreatRead(
                    record.passage.id,
                    currentSection.id,
                  );
                  applyRecord(updated);
                } catch (err) {
                  Alert.alert(
                    'Could not go back',
                    err instanceof Error ? err.message : String(err),
                  );
                } finally {
                  setSaving(false);
                }
              })();
            },
          },
        ],
      );
      return;
    }

    Alert.alert(
      'Go to previous section?',
      "You will leave this section and return to the previous section's reading progress.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Go back',
          onPress: () => {
            void (async () => {
              setSaving(true);
              try {
                const updated = await goToPreviousSectionRead(
                  record.passage.id,
                  currentSection.id,
                );
                applyRecord(updated);
              } catch (err) {
                Alert.alert(
                  'Could not go back',
                  err instanceof Error ? err.message : String(err),
                );
              } finally {
                setSaving(false);
              }
            })();
          },
        },
      ],
    );
  }, [
    applyRecord,
    currentSection,
    goToPreviousSectionRead,
    progress,
    record,
    retreatRead,
    router,
    saving,
    sectionIndex,
  ]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  if (!record || !currentSection || !progress || !currentVerse) {
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

  const verseCount = sectionVerseCount(record, currentSection.id);
  const versePosition = Math.min(progress.currentVerseIndex + 1, verseCount);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
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

      <PassageTaskProgress steps={SECTION_TASK_STEPS} currentIndex={0} />

      <View className="border-b border-border px-5 py-4">
        <Text className="text-xs font-semibold uppercase tracking-wide text-secondary">
          Read section · {sectionIndex + 1} of {sections.length}
        </Text>
        <Text
          className="mt-2 text-xl font-semibold text-primary"
          style={{ color: sectionAccent }}>
          {currentSection.title || 'Untitled section'}
        </Text>
        <Text className="mt-2 text-base leading-6 text-primary">
          Read each verse carefully. Complete all five rounds before continuing.
        </Text>
        <Text className="mt-3 text-sm font-semibold text-secondary">
          Round {progress.currentRound} of {READ_ROUND_COUNT}
          {' · '}
          Verse {versePosition} of {verseCount}
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-5 pt-6"
        contentContainerStyle={{ paddingBottom: layout.screenBottomPadding + 40 }}
        showsVerticalScrollIndicator={false}>
        <Text className="mb-3 text-xs font-semibold uppercase tracking-wide text-secondary">
          {referencePreview}
        </Text>
        <VerseBlock
          verse={currentVerse.verse}
          text={currentVerse.text}
          highlightColor={sectionTint}
        />
      </ScrollView>

      <SelectionConfirmBar
        count={1}
        countLabel={`Round ${progress.currentRound} of ${READ_ROUND_COUNT}`}
        referencePreview={referencePreview}
        confirmLabel={confirmLabel}
        alwaysVisible
        loading={saving}
        onConfirm={() => {
          void handleContinue();
        }}
      />
    </SafeAreaView>
  );
}
