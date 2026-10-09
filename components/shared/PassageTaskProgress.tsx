import { Text, View } from 'react-native';

import { colors } from '@/constants/tokens';

export type PassageTaskStep = {
  key: string;
  label: string;
};

export type PassageTaskProgressProps = {
  steps: PassageTaskStep[];
  /** Index of the active step (0-based). Steps before this are complete. */
  currentIndex: number;
  /** Step keys that were skipped (shown as complete but labeled skip). */
  skippedKeys?: string[];
};

export function PassageTaskProgress({
  steps,
  currentIndex,
  skippedKeys = [],
}: PassageTaskProgressProps) {
  const skipped = new Set(skippedKeys);

  return (
    <View className="border-b border-border px-5 py-3">
      <View className="flex-row items-center justify-between gap-2">
        {steps.map((step, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isSkipped = skipped.has(step.key) && isComplete;

          const fill = isCurrent || isComplete ? colors.accent : colors.border;

          return (
            <View key={step.key} className="min-w-0 flex-1">
              <View
                className="h-1.5 rounded-full"
                style={{
                  backgroundColor: fill,
                  opacity: isCurrent ? 1 : isComplete ? 0.55 : 1,
                }}
              />
              <Text
                className="mt-1.5 text-center text-[10px] font-semibold"
                numberOfLines={1}
                style={{
                  color: isCurrent ? colors.accent : colors.textSecondary,
                }}>
                {isSkipped ? `${step.label} · skip` : step.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
