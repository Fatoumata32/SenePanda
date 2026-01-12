// Redirection vers le nouveau viewer
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function LiveRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={`/(tabs)/live-viewer/${id}`} />;
}
