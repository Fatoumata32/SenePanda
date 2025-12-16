import { useEffect, useState } from 'react';
import { useNavigation as useNavigationContext } from '@/contexts/NavigationContext';
import { useRouter, useSegments, usePathname } from 'expo-router';
import RoleSelectionScreen from './RoleSelectionScreen';

/**
 * Composant qui gère la redirection automatique basée sur le rôle
 * Affiche l'écran de sélection de rôle si nécessaire
 *
 * Logique simple:
 * - Affiche l'écran de sélection si pas de rôle
 * - Redirection UNIQUEMENT à la connexion initiale
 * - Permet la navigation libre entre toutes les pages après
 */
export function RoleRedirect({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hasRoleSelected, userRole, setUserRole, isLoading } = useNavigationContext();
  const router = useRouter();
  const pathname = usePathname();
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    // L'utilisateur est authentifié
    if (isAuthenticated) {
      // Vérifier si le rôle est sélectionné
      if (!hasRoleSelected || !userRole) {
        // Afficher l'écran de sélection de rôle
        setShowRoleSelection(true);
      } else {
        // Le rôle est sélectionné
        setShowRoleSelection(false);

        // Redirection UNIQUEMENT si on vient de se connecter et qu'on n'a pas encore redirigé
        if (!hasRedirected && (pathname === '/' || pathname === '/(tabs)')) {
          setHasRedirected(true);

          if (userRole === 'seller') {
            router.replace('/seller/my-shop' as any);
          } else {
            router.replace('/(tabs)' as any);
          }
        }
        // Sinon, laisser l'utilisateur naviguer librement
      }
    } else {
      // Non authentifié, ne pas afficher la sélection de rôle
      setShowRoleSelection(false);
      setHasRedirected(false);
    }
  }, [isAuthenticated, hasRoleSelected, userRole, isLoading, pathname, hasRedirected]);

  const handleRoleSelected = async (role: 'buyer' | 'seller') => {
    try {
      // Sauvegarder le rôle
      await setUserRole(role);

      // Masquer l'écran de sélection
      setShowRoleSelection(false);

      // Marquer comme redirigé
      setHasRedirected(true);

      // Rediriger vers l'interface appropriée
      if (role === 'seller') {
        router.replace('/seller/my-shop' as any);
      } else {
        router.replace('/(tabs)' as any);
      }
    } catch (error) {
      console.error('Error handling role selection:', error);
      // Gérer l'erreur (afficher un toast, etc.)
    }
  };

  // Afficher l'écran de sélection de rôle si nécessaire
  if (showRoleSelection) {
    return <RoleSelectionScreen onRoleSelected={handleRoleSelected} />;
  }

  // Sinon, afficher le contenu normal
  return <>{children}</>;
}
