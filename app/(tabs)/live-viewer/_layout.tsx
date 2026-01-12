import { Stack } from 'expo-router';

export default function LiveViewerLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        presentation: 'modal',
      }}
    >
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: false,
          animation: 'fade',
        }}
      />
    </Stack>
  );
}
