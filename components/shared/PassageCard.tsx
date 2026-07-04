import { Pressable, Text, View } from 'react-native';

import { colors, radii, shadow, type PassageStatus } from '@/constants/tokens';

export type PassageCardProps = {
  title: string;
  reference: string;
  status: PassageStatus;
  progressHint?: string;
  updatedAt?: string;
  sectionColor?: string;
  onPress?: () => void;
};

function StatusBadge({ status }: { status: PassageStatus }) {
  const isComplete = status === 'completed';

  return (
    <View
      className="rounded-full px-2.5 py-1"
      style={{
        backgroundColor: isComplete ? colors.successMuted : colors.warningMuted,
      }}>
      <Text
        className="text-xs font-semibold"
        style={{ color: isComplete ? colors.success : colors.warning }}>
        {isComplete ? 'Complete' : 'In progress'}
      </Text>
    </View>
  );
}

export function PassageCard({
  title,
  reference,
  status,
  progressHint,
  updatedAt,
  sectionColor,
  onPress,
}: PassageCardProps) {
  const subtitle =
    status === 'completed'
      ? updatedAt
        ? `Completed · ${updatedAt}`
        : 'Completed'
      : progressHint ?? 'Continue memorizing';

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="mb-3 flex-row items-start rounded-xl border border-border bg-surface p-4 active:opacity-90"
      style={{ borderRadius: radii.lg, ...shadow.card }}>
      {sectionColor ? (
        <View
          className="mr-3 mt-1 h-3 w-3 rounded-full"
          style={{ backgroundColor: sectionColor }}
        />
      ) : null}
      <View className="flex-1">
        <View className="mb-2 flex-row items-start justify-between gap-2">
          <Text className="flex-1 text-base font-semibold text-primary">{title}</Text>
          <StatusBadge status={status} />
        </View>
        <Text className="mb-1 text-sm text-secondary">{reference}</Text>
        <Text className="text-xs text-secondary">{subtitle}</Text>
      </View>
    </Pressable>
  );
}
