import { Pressable, Text, View } from 'react-native';

import { colors, radii } from '@/constants/tokens';

export type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View
      className="items-center rounded-xl border border-dashed border-border bg-surface px-6 py-10"
      style={{ borderRadius: radii.lg }}>
      <Text className="mb-2 text-center text-lg font-semibold text-primary">{title}</Text>
      <Text className="mb-6 text-center text-sm leading-5 text-secondary">{description}</Text>
      {actionLabel ? (
        <Pressable
          onPress={onAction}
          disabled={!onAction}
          className="rounded-full bg-accent px-6 py-3 active:opacity-80"
          style={{ opacity: onAction ? 1 : 0.5 }}>
          <Text className="text-sm font-semibold text-white">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
