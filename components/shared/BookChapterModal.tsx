import { useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getBooksByTestament, type BibleBook } from '@/lib/bible/books';
import { colors } from '@/constants/tokens';

export type BookChapterModalProps = {
  visible: boolean;
  initialBookId: string;
  onClose: () => void;
  onSelectChapter: (bookId: string, chapter: number) => void;
};

const SCROLL_TOP_INSET = 12;

export function BookChapterModal({
  visible,
  initialBookId,
  onClose,
  onSelectChapter,
}: BookChapterModalProps) {
  const [selectedBookId, setSelectedBookId] = useState(initialBookId);
  const otBooks = useMemo(() => getBooksByTestament('OT'), []);
  const ntBooks = useMemo(() => getBooksByTestament('NT'), []);

  const scrollRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<Record<string, number>>({});
  const rowOffsets = useRef<Record<string, { section: string; y: number }>>({});

  const scrollToBook = (bookId: string) => {
    const row = rowOffsets.current[bookId];
    if (!row) return;
    const sectionY = sectionOffsets.current[row.section] ?? 0;
    scrollRef.current?.scrollTo({
      y: Math.max(0, sectionY + row.y - SCROLL_TOP_INSET),
      animated: true,
    });
  };

  // Layout settles across a frame or two after expansion/collapse re-renders,
  // so defer the scroll until the recorded offsets are up to date.
  const scheduleScrollToBook = (bookId: string) => {
    setTimeout(() => scrollToBook(bookId), 80);
  };

  const handleOpen = () => {
    setSelectedBookId(initialBookId);
    scheduleScrollToBook(initialBookId);
  };

  const handleSelectBook = (book: BibleBook) => {
    setSelectedBookId(book.id);
    scheduleScrollToBook(book.id);
  };

  const handleSelectChapter = (bookId: string, chapter: number) => {
    onSelectChapter(bookId, chapter);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onShow={handleOpen}
      onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        <View className="flex-row items-center justify-between border-b border-border px-6 pb-3 pt-5">
          <Pressable onPress={onClose} hitSlop={12} className="py-1 pr-2">
            <Text className="text-base font-medium text-accent">Close</Text>
          </Pressable>
          <Text className="text-base font-semibold text-primary">Go to</Text>
          <View className="w-14" />
        </View>

        <ScrollView
          ref={scrollRef}
          className="flex-1 px-5"
          contentContainerStyle={{ paddingBottom: 32 }}>
          <BookSection
            title="Old Testament"
            books={otBooks}
            selectedBookId={selectedBookId}
            onSectionLayout={(y) => {
              sectionOffsets.current['Old Testament'] = y;
            }}
            onRowLayout={(bookId, y) => {
              rowOffsets.current[bookId] = { section: 'Old Testament', y };
            }}
            onSelectBook={handleSelectBook}
            onSelectChapter={handleSelectChapter}
          />
          <BookSection
            title="New Testament"
            books={ntBooks}
            selectedBookId={selectedBookId}
            onSectionLayout={(y) => {
              sectionOffsets.current['New Testament'] = y;
            }}
            onRowLayout={(bookId, y) => {
              rowOffsets.current[bookId] = { section: 'New Testament', y };
            }}
            onSelectBook={handleSelectBook}
            onSelectChapter={handleSelectChapter}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function BookSection({
  title,
  books,
  selectedBookId,
  onSectionLayout,
  onRowLayout,
  onSelectBook,
  onSelectChapter,
}: {
  title: string;
  books: BibleBook[];
  selectedBookId: string;
  onSectionLayout: (y: number) => void;
  onRowLayout: (bookId: string, y: number) => void;
  onSelectBook: (book: BibleBook) => void;
  onSelectChapter: (bookId: string, chapter: number) => void;
}) {
  return (
    <View className="mt-4" onLayout={(e) => onSectionLayout(e.nativeEvent.layout.y)}>
      <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-secondary">
        {title}
      </Text>
      {books.map((book) => {
        const expanded = book.id === selectedBookId;
        return (
          <View
            key={book.id}
            onLayout={(e) => onRowLayout(book.id, e.nativeEvent.layout.y)}
            className="mb-2 overflow-hidden rounded-xl border border-border bg-surface">
            <Pressable
              onPress={() => onSelectBook(book)}
              className="flex-row items-center justify-between px-4 py-3"
              style={expanded ? { backgroundColor: colors.accentMuted } : undefined}>
              <Text
                className="text-base"
                style={{
                  color: expanded ? colors.accent : colors.textPrimary,
                  fontWeight: expanded ? '600' : '400',
                }}>
                {book.name}
              </Text>
              <Text className="text-xs text-secondary">
                {expanded ? '▲' : '▼'} {book.chapterCount}
              </Text>
            </Pressable>

            {expanded ? (
              <View className="border-t border-border px-3 pb-3 pt-3">
                <View className="flex-row flex-wrap gap-2">
                  {Array.from({ length: book.chapterCount }, (_, index) => {
                    const chapter = index + 1;
                    return (
                      <Pressable
                        key={chapter}
                        onPress={() => onSelectChapter(book.id, chapter)}
                        className="h-14 w-14 items-center justify-center rounded-xl border border-border bg-background">
                        <Text className="text-base font-semibold text-primary">{chapter}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
