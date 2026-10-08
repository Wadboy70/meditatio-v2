import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  BibleReader,
  BookChapterModal,
  SelectionConfirmBar,
} from '@/components';
import { usePassages } from '@/hooks/usePassages';
import { getBook, type ChapterLocation } from '@/lib/bible/books';
import {
  formatPassageReference,
  routeAfterCreate,
  verseRefKey,
  type VerseSelectionRef,
} from '@/lib/storage';
import { colors } from '@/constants/tokens';

export default function PassageReaderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    translationId?: string;
    bookId?: string;
    chapter?: string;
    openPicker?: string;
  }>();

  const translationId = params.translationId ?? 'net';
  const initialBookId = params.bookId ?? 'genesis';
  const initialChapter = Number(params.chapter ?? '1') || 1;

  const { createFromSelection } = usePassages();
  const [modalVisible, setModalVisible] = useState(params.openPicker === '1');
  const [visibleBookId, setVisibleBookId] = useState(initialBookId);
  const [visibleChapter, setVisibleChapter] = useState(initialChapter);
  const [jumpTarget, setJumpTarget] = useState<ChapterLocation | null>(null);
  const [selection, setSelection] = useState<VerseSelectionRef[]>([]);
  const [creating, setCreating] = useState(false);

  const selectedKeys = useMemo(
    () => new Set(selection.map((ref) => verseRefKey(ref))),
    [selection],
  );

  const navLabel = useMemo(() => {
    const book = getBook(visibleBookId);
    return `${book?.name ?? visibleBookId} ${visibleChapter}`;
  }, [visibleBookId, visibleChapter]);

  const referencePreview = useMemo(() => formatPassageReference(selection), [selection]);

  const selectionBookId = selection[0]?.bookId ?? visibleBookId;

  const handleVisibleChapterChange = useCallback((bookId: string, chapter: number) => {
    setVisibleBookId(bookId);
    setVisibleChapter(chapter);
  }, []);

  const handleToggleVerse = useCallback((ref: VerseSelectionRef) => {
    setSelection((prev) => {
      const key = verseRefKey(ref);
      const exists = prev.some((item) => verseRefKey(item) === key);
      if (exists) {
        return prev.filter((item) => verseRefKey(item) !== key);
      }
      if (prev.length > 0 && prev[0].bookId !== ref.bookId) {
        Alert.alert(
          'One book at a time',
          'Clear your selection or stay within the same book to continue.',
        );
        return prev;
      }
      return [...prev, ref];
    });
  }, []);

  const handleSelectChapter = useCallback((bookId: string, chapter: number) => {
    setVisibleBookId(bookId);
    setVisibleChapter(chapter);
    setJumpTarget({ bookId, chapter });
  }, []);

  const handleConfirm = useCallback(async () => {
    if (selection.length === 0) return;
    setCreating(true);
    try {
      const record = await createFromSelection(translationId, selectionBookId, selection);
      if (routeAfterCreate(record.passage.currentTaskId) === 'sections') {
        router.replace({
          pathname: '/passage/sections',
          params: { passageId: record.passage.id },
        });
      } else {
        router.replace('/(tabs)');
      }
    } catch (err) {
      Alert.alert('Could not create passage', err instanceof Error ? err.message : String(err));
    } finally {
      setCreating(false);
    }
  }, [createFromSelection, router, selection, selectionBookId, translationId]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between border-b border-border px-3 py-2">
        <Pressable onPress={() => router.back()} hitSlop={12} className="px-2 py-2">
          <Text className="text-base font-medium" style={{ color: colors.accent }}>
            Back
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setModalVisible(true)}
          className="rounded-full border border-border bg-surface px-4 py-2">
          <Text className="text-sm font-semibold text-primary">{navLabel}</Text>
        </Pressable>

        <View className="w-14" />
      </View>

      <BibleReader
        translationId={translationId}
        initialBookId={initialBookId}
        initialChapter={initialChapter}
        jumpTarget={jumpTarget}
        selectedKeys={selectedKeys}
        onToggleVerse={handleToggleVerse}
        onVisibleChapterChange={handleVisibleChapterChange}
        onJumpHandled={() => setJumpTarget(null)}
      />

      <SelectionConfirmBar
        count={selection.length}
        referencePreview={referencePreview}
        loading={creating}
        onConfirm={() => {
          void handleConfirm();
        }}
      />

      <BookChapterModal
        visible={modalVisible}
        initialBookId={visibleBookId}
        onClose={() => setModalVisible(false)}
        onSelectChapter={handleSelectChapter}
      />
    </SafeAreaView>
  );
}
