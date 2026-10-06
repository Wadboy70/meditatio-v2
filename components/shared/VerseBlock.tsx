import { Pressable, Text, View } from 'react-native';

import { colors } from '@/constants/tokens';

export type VerseBlockProps = {
  verse: number;
  text: string;
  selected?: boolean;
  onPress?: () => void;
};

export function VerseBlock({ verse, text, selected = false, onPress }: VerseBlockProps) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-3 rounded-lg px-2 py-1.5"
      style={{
        backgroundColor: selected ? colors.accentMuted : 'transparent',
      }}>
      <Text className="text-base leading-7 text-primary">
        <Text className="text-[11px] font-semibold text-secondary">{verse} </Text>
        {text}
      </Text>
    </Pressable>
  );
}
