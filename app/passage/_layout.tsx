import { Stack } from 'expo-router';

export default function PassageLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="new" />
      <Stack.Screen name="reader" />
    </Stack>
  );
}
