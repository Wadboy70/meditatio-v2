import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, PassageCard } from '@/components';
import { layout, sectionColors } from '@/constants/tokens';
import { usePassages } from '@/hooks/usePassages';
import { getBook } from '@/lib/bible/books';
import { getTranslation } from '@/lib/bible/translations';

function taskHint(currentTaskId: string): string {
  switch (currentTaskId) {
    case 'divide_sections':
      return 'Next: Divide into sections';
    case 'name_sections':
      return 'Next: Name sections';
    default:
      return 'In progress';
  }
}

export default function HomeScreen() {
  const router = useRouter();
  const { passages, loading, refresh } = usePassages();

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  const handleStartPassage = () => {
    router.push('/passage/new');
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: layout.screenBottomPadding }}
        showsVerticalScrollIndicator={false}>
        <View className="pb-6 pt-4">
          <Text className="text-3xl font-bold text-primary">Meditatio</Text>
          <Text className="mt-1 text-base text-secondary">
            Memorize Scripture with personalized scaffolds.
          </Text>
        </View>

        {!loading && passages.length === 0 ? (
          <EmptyState
            title="No passages yet"
            description="Start your first memorization journey by selecting a Bible passage."
            actionLabel="Start a passage"
            onAction={handleStartPassage}
          />
        ) : (
          <>
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-primary">My Passages</Text>
              <Pressable onPress={handleStartPassage}>
                <Text className="text-sm font-semibold text-accent">New</Text>
              </Pressable>
            </View>
            {passages.map((passage, index) => {
              const book = getBook(passage.bookId);
              const translation = getTranslation(passage.translationId);

              return (
                <PassageCard
                  key={passage.id}
                  title={passage.title || `${book?.name ?? passage.bookId}`}
                  reference={translation?.abbreviation ?? passage.translationId.toUpperCase()}
                  status={passage.status}
                  progressHint={
                    passage.status === 'in_progress'
                      ? taskHint(passage.currentTaskId)
                      : undefined
                  }
                  updatedAt={
                    passage.status === 'completed'
                      ? new Date(passage.updatedAt).toLocaleDateString()
                      : undefined
                  }
                  sectionColor={sectionColors[index % sectionColors.length]}
                  onPress={() =>
                    Alert.alert('Coming soon', 'Continue memorization will be available next.')
                  }
                />
              );
            })}
            <View className="mt-2">
              <EmptyState
                title="Ready for more?"
                description="Add another passage whenever you want to keep growing."
                actionLabel="Start a passage"
                onAction={handleStartPassage}
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
