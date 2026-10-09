import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { bibleTextService } from '@/lib/bible/BibleTextService';
import { TRANSLATIONS } from '@/lib/bible/translations';
import { colors } from '@/constants/tokens';

export default function NewPassageScreen() {
  const router = useRouter();
  const [availability, setAvailability] = useState<Record<string, boolean> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAvailability() {
      const entries = await Promise.all(
        TRANSLATIONS.map(async (translation) => {
          const available = await bibleTextService.isAvailable(translation.id);
          return [translation.id, available] as const;
        }),
      );
      if (!cancelled) {
        setAvailability(Object.fromEntries(entries));
      }
    }

    void loadAvailability();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-between border-b border-border px-3 py-2">
        <Pressable
          onPress={() => router.replace('/(tabs)')}
          hitSlop={12}
          className="px-2 py-2">
          <Text className="text-base font-medium" style={{ color: colors.accent }}>
            Back
          </Text>
        </Pressable>

        <Text className="text-base font-semibold text-primary">Translation</Text>

        <View className="w-14" />
      </View>

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 32 }}>
        <Text className="mt-2 text-base text-secondary">
          Choose a translation to start selecting a passage.
        </Text>

        {availability == null ? (
          <View className="mt-10 items-center">
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : (
          <View className="mt-6">
            {TRANSLATIONS.map((translation) => {
              const enabled = availability[translation.id] === true;
              return (
                <Pressable
                  key={translation.id}
                  disabled={!enabled}
                  onPress={() =>
                    router.push({
                      pathname: '/passage/reader',
                      params: {
                        translationId: translation.id,
                        bookId: 'genesis',
                        chapter: '1',
                        openPicker: '1',
                      },
                    })
                  }
                  className="mb-3 rounded-xl border border-border bg-surface p-4"
                  style={{ opacity: enabled ? 1 : 0.5 }}>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="text-lg font-semibold text-primary">
                        {translation.displayName}
                      </Text>
                      <Text className="mt-1 text-sm text-secondary">
                        {translation.abbreviation} · {translation.language.toUpperCase()}
                        {!enabled ? ' · Not imported on this device' : ' · Offline'}
                      </Text>
                    </View>
                    {enabled ? (
                      <Text className="text-sm font-semibold" style={{ color: colors.accent }}>
                        Open
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
