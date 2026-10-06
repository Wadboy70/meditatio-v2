import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Text,
  View,
  type ViewToken,
} from 'react-native';

import { VerseBlock } from '@/components/shared/VerseBlock';
import { bibleTextService } from '@/lib/bible/BibleTextService';
import {
  getBook,
  getNextChapter,
  getPreviousChapter,
  type ChapterLocation,
} from '@/lib/bible/books';
import { verseRefKey, type VerseSelectionRef } from '@/lib/storage';
import type { Verse } from '@/lib/bible/types';
import { colors } from '@/constants/tokens';

export type ChapterBlock = {
  key: string;
  bookId: string;
  chapter: number;
  verses: Verse[];
};

export type BibleReaderProps = {
  translationId: string;
  initialBookId: string;
  initialChapter: number;
  jumpTarget: ChapterLocation | null;
  selectedKeys: Set<string>;
  onToggleVerse: (ref: VerseSelectionRef) => void;
  onVisibleChapterChange: (bookId: string, chapter: number) => void;
  onJumpHandled?: () => void;
};

function chapterKey(bookId: string, chapter: number): string {
  return `${bookId}:${chapter}`;
}

export function BibleReader({
  translationId,
  initialBookId,
  initialChapter,
  jumpTarget,
  selectedKeys,
  onToggleVerse,
  onVisibleChapterChange,
  onJumpHandled,
}: BibleReaderProps) {
  const listRef = useRef<FlatList<ChapterBlock>>(null);
  const loadingRef = useRef(false);
  const prependLock = useRef(false);
  const [chapters, setChapters] = useState<ChapterBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadChapter = useCallback(
    async (bookId: string, chapter: number): Promise<ChapterBlock | null> => {
      const verses = await bibleTextService.getChapterVerses(translationId, bookId, chapter);
      if (verses.length === 0) return null;
      return {
        key: chapterKey(bookId, chapter),
        bookId,
        chapter,
        verses,
      };
    },
    [translationId],
  );

  const seed = useCallback(
    async (bookId: string, chapter: number) => {
      setLoading(true);
      setError(null);
      try {
        const block = await loadChapter(bookId, chapter);
        if (!block) {
          setError('Could not load this chapter. Is the Bible database installed?');
          setChapters([]);
          return;
        }
        setChapters([block]);
        onVisibleChapterChange(bookId, chapter);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setChapters([]);
      } finally {
        setLoading(false);
      }
    },
    [loadChapter, onVisibleChapterChange],
  );

  useEffect(() => {
    void seed(initialBookId, initialChapter);
    // Only seed on mount / translation change — jumps handled separately
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [translationId]);

  useEffect(() => {
    if (!jumpTarget) return;
    void (async () => {
      await seed(jumpTarget.bookId, jumpTarget.chapter);
      onJumpHandled?.();
      requestAnimationFrame(() => {
        listRef.current?.scrollToOffset({ offset: 0, animated: false });
      });
    })();
  }, [jumpTarget, seed, onJumpHandled]);

  const appendNext = useCallback(async () => {
    if (loadingRef.current || chapters.length === 0) return;
    const last = chapters[chapters.length - 1];
    const next = getNextChapter(last.bookId, last.chapter);
    if (!next) return;

    loadingRef.current = true;
    try {
      const block = await loadChapter(next.bookId, next.chapter);
      if (block) {
        setChapters((prev) => {
          if (prev.some((item) => item.key === block.key)) return prev;
          return [...prev, block];
        });
      }
    } finally {
      loadingRef.current = false;
    }
  }, [chapters, loadChapter]);

  const prependPrevious = useCallback(async () => {
    if (loadingRef.current || prependLock.current || chapters.length === 0) return;
    const first = chapters[0];
    const previous = getPreviousChapter(first.bookId, first.chapter);
    if (!previous) return;

    loadingRef.current = true;
    prependLock.current = true;
    try {
      const block = await loadChapter(previous.bookId, previous.chapter);
      if (block) {
        setChapters((prev) => {
          if (prev.some((item) => item.key === block.key)) return prev;
          return [block, ...prev];
        });
      }
    } finally {
      loadingRef.current = false;
      // Allow another prepend after layout settles
      setTimeout(() => {
        prependLock.current = false;
      }, 400);
    }
  }, [chapters, loadChapter]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems.find((item) => item.isViewable && item.item);
      if (!first?.item) return;
      const block = first.item as ChapterBlock;
      onVisibleChapterChange(block.bookId, block.chapter);
    },
  ).current;

  const viewabilityConfig = useMemo(
    () => ({
      itemVisiblePercentThreshold: 20,
      minimumViewTime: 80,
    }),
    [],
  );

  if (loading && chapters.length === 0) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (error && chapters.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-center text-base text-secondary">{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      ref={listRef}
      data={chapters}
      keyExtractor={(item) => item.key}
      className="flex-1"
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 120 }}
      maintainVisibleContentPosition={{ minIndexForVisible: 1 }}
      onEndReached={() => {
        void appendNext();
      }}
      onEndReachedThreshold={0.4}
      onScroll={(event) => {
        if (event.nativeEvent.contentOffset.y < 80) {
          void prependPrevious();
        }
      }}
      scrollEventThrottle={100}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      renderItem={({ item }) => {
        const book = getBook(item.bookId);
        return (
          <View className="mb-6 w-full max-w-xl self-center">
            <Text className="mb-3 text-xl font-bold text-primary">
              {book?.name ?? item.bookId} {item.chapter}
            </Text>
            {item.verses.map((verse) => {
              const ref: VerseSelectionRef = {
                bookId: verse.bookId,
                chapter: verse.chapter,
                verse: verse.verse,
              };
              const key = verseRefKey(ref);
              return (
                <VerseBlock
                  key={key}
                  verse={verse.verse}
                  text={verse.text}
                  selected={selectedKeys.has(key)}
                  onPress={() => onToggleVerse(ref)}
                />
              );
            })}
          </View>
        );
      }}
    />
  );
}
