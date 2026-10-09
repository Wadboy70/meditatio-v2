import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, shadow } from '@/constants/tokens';

export type SelectionConfirmBarProps = {
  count: number;
  referencePreview?: string;
  loading?: boolean;
  disabled?: boolean;
  confirmLabel?: string;
  countLabel?: string;
  /** When true, show the bar even if count is 0 (e.g. Continue after all assigned). */
  alwaysVisible?: boolean;
  onConfirm: () => void;
};

export function SelectionConfirmBar({
  count,
  referencePreview,
  loading = false,
  disabled = false,
  confirmLabel = 'Create passage',
  countLabel,
  alwaysVisible = false,
  onConfirm,
}: SelectionConfirmBarProps) {
  const insets = useSafeAreaInsets();

  if (!alwaysVisible && count <= 0) return null;

  const primaryLabel =
    countLabel ?? `${count} verse${count === 1 ? '' : 's'} selected`;
  const isDisabled = loading || disabled;

  return (
    <View
      className="absolute left-4 right-4 rounded-2xl border border-border bg-surface px-4 py-3"
      style={{
        bottom: Math.max(insets.bottom, 12) + 8,
        ...shadow.floatingNav,
      }}>
      <View className="flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text className="text-sm font-semibold text-primary">{primaryLabel}</Text>
          {referencePreview ? (
            <Text className="mt-0.5 text-xs text-secondary" numberOfLines={1}>
              {referencePreview}
            </Text>
          ) : null}
        </View>
        <Pressable
          onPress={onConfirm}
          disabled={isDisabled}
          className="rounded-full px-4 py-2.5"
          style={{
            backgroundColor: colors.accent,
            opacity: isDisabled ? 0.45 : 1,
          }}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text className="text-sm font-semibold text-white">{confirmLabel}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
