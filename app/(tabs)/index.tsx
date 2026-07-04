import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState, PassageCard } from '@/components';
import { layout, sectionColors } from '@/constants/tokens';

/** Dev placeholders — replace with local storage in a future phase */
const PLACEHOLDER_PASSAGES = [
  {
    id: '1',
    title: 'God So Loved the World',
    reference: 'John 3:16–21',
    status: 'in_progress' as const,
    progressHint: 'Section 2 · Word recall',
    sectionColor: sectionColors[0],
  },
  {
    id: '2',
    title: 'The Lord Is My Shepherd',
    reference: 'Psalm 23:1–6',
    status: 'completed' as const,
    updatedAt: 'Jul 1, 2026',
    sectionColor: sectionColors[2],
  },
  {
    id: '3',
    title: 'Love Is Patient',
    reference: '1 Corinthians 13:4–7',
    status: 'in_progress' as const,
    progressHint: 'Section 1 · Read section',
    sectionColor: sectionColors[1],
  },
];

const SHOW_PLACEHOLDER_DATA = true;

function handleStartPassage() {
  Alert.alert('Coming soon', 'Passage creation will be available in the next phase.');
}

export default function HomeScreen() {
  const passages = SHOW_PLACEHOLDER_DATA ? PLACEHOLDER_PASSAGES : [];

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

        {passages.length === 0 ? (
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
              <Text className="text-xs font-medium text-secondary">Sample data</Text>
            </View>
            {passages.map((passage) => (
              <PassageCard
                key={passage.id}
                title={passage.title}
                reference={passage.reference}
                status={passage.status}
                progressHint={passage.progressHint}
                updatedAt={passage.updatedAt}
                sectionColor={passage.sectionColor}
                onPress={handleStartPassage}
              />
            ))}
            <View className="mt-6">
              <EmptyState
                title="Ready for more?"
                description="Add another passage when memorization setup is available."
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
