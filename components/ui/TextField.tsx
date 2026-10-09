import { TextInput, type TextInputProps, View, Text } from 'react-native';

import { colors } from '@/constants/tokens';

export type TextFieldProps = TextInputProps & {
  label?: string;
};

export function TextField({ label, style, ...props }: TextFieldProps) {
  return (
    <View>
      {label ? (
        <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-secondary">
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor={colors.textSecondary}
        className="rounded-xl border border-border bg-surface px-4 py-3 text-base text-primary"
        style={style}
        {...props}
      />
    </View>
  );
}
