import { ScrollView, Text, View } from 'react-native';

import { VerseBlock } from '@/components/shared/VerseBlock';
import type { PassageVerse } from '@/lib/storage';

export type PassageVerseListProps = {
  verses: PassageVerse[];
  bookId: string;
  selectedKeys: Set<string>;
  /** Map of verseRefKey → muted highlight color for locked sections. */
  highlightByKey?: Map<string, string>;
  onToggleVerse: (passageVerseId: string) => void;
  contentBottomPadding?: number;
};

function passageVerseKey(bookId: string, verse: PassageVerse): string {
  return `${bookId}:${verse.chapter}:${verse.verse}`;
}

export function PassageVerseList({
  verses,
  bookId,
  selectedKeys,
  highlightByKey,
  onToggleVerse,
  contentBottomPadding = 120,
}: PassageVerseListProps) {
  const ordered = [...verses].sort((a, b) => a.order - b.order);

  let lastChapter: number | null = null;

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: contentBottomPadding }}
      showsVerticalScrollIndicator={false}>
      {ordered.map((verse) => {
        const key = passageVerseKey(bookId, verse);
        const showChapter = verse.chapter !== lastChapter;
        lastChapter = verse.chapter;

        return (
          <View key={verse.id}>
            {showChapter ? (
              <Text className="mb-2 mt-4 text-sm font-semibold text-secondary">
                Chapter {verse.chapter}
              </Text>
            ) : null}
            <VerseBlock
              verse={verse.verse}
              text={verse.text}
              selected={selectedKeys.has(key)}
              highlightColor={highlightByKey?.get(key)}
              onPress={() => onToggleVerse(verse.id)}
            />
          </View>
        );
      })}
    </ScrollView>
  );
}
