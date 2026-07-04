import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { layout } from '@/constants/tokens';

export default function ProfileScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: layout.screenBottomPadding }}
        showsVerticalScrollIndicator={false}>
        <View className="pb-6 pt-4">
          <Text className="text-3xl font-bold text-primary">Profile</Text>
          <Text className="mt-1 text-base text-secondary">
            User settings and account options will live here.
          </Text>
        </View>

        <View className="rounded-xl border border-border bg-surface p-4">
          <Text className="text-xs font-semibold uppercase tracking-wide text-secondary">
            Account
          </Text>
          <Text className="mt-2 text-base text-primary">Not signed in</Text>
          <Text className="mt-1 text-sm text-secondary">
            Cloud sync and accounts are planned for a future release.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
