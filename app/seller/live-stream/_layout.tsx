import { Stack } from 'expo-router';

export default function LiveStreamLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    />
  );
}
