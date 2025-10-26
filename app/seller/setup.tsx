import { useEffect } from 'react';
import { useRouter } from 'expo-router';

// Ce fichier redirige vers le nouveau wizard avec preview en temps réel
export default function SellerSetupScreen() {
  const router = useRouter();

  useEffect(() => {
    // Redirection immédiate vers le nouveau wizard
    router.replace('/seller/shop-wizard');
  }, []);

  return null;
}
