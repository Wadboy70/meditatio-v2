import { Pressable, Text } from 'react-native';

import { colors } from '@/constants/tokens';

export type VerseBlockProps = {
  verse: number;
  text: string;
  selected?: boolean;
  /** Locked section tint; ignored while `selected` (draft uses accentMuted). */
  highlightColor?: string;
  onPress?: () => void;
};

export function VerseBlock({
  verse,
  text,
  selected = false,
  highlightColor,
  onPress,
}: VerseBlockProps) {
  const backgroundColor = selected
    ? colors.accentMuted
    : (highlightColor ?? 'transparent');

  return (
    <Pressable
      onPress={onPress}
      className="mb-3 rounded-lg px-2 py-1.5"
      style={{ backgroundColor }}>
      <Text className="text-base leading-7 text-primary">
        <Text className="text-[11px] font-semibold text-secondary">{verse} </Text>
        {text}
      </Text>
    </Pressable>
  );
}
