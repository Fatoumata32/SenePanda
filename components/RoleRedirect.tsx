import { useEffect, useState } from 'react';
import { useNavigation as useNavigationContext } from '@/contexts/NavigationContext';
import { useRouter, useSegments } from 'expo-router';
import RoleSelectionScreen from './RoleSelectionScreen';

/**
 * Composant qui gère la redirection automatique basée sur le rôle
 * Affiche l'écran de sélection de rôle si nécessaire
 */
export function RoleRedirect({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hasRoleSelected, userRole, setUserRole, isLoading } = useNavigationContext();
  const router = useRouter();
  const segments = useSegments();
  const [showRoleSelection, setShowRoleSelection] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    // L'utilisateur est authentifié
    if (isAuthenticated) {
      // Vérifier si le rôle est sélectionné
      if (!hasRoleSelected || !userRole) {
        // Afficher l'écran de sélection de rôle
        setShowRoleSelection(true);
      } else {
        // Le rôle est sélectionné, rediriger vers l'interface appropriée
        setShowRoleSelection(false);

        // Vérifier si on est déjà dans la bonne section
        const inTabsSection = segments[0] === '(tabs)';
        const inSellerSection = segments[0] === 'seller';

        if (userRole === 'seller' && inTabsSection) {
          // Rediriger vers l'interface vendeur
          router.replace('/seller/my-shop' as any);
        } else if (userRole === 'buyer' && inSellerSection) {
          // Rediriger vers l'interface acheteur
          router.replace('/' as any);
        }
        // Si on est déjà dans la bonne section, ne rien faire
      }
    } else {
      // Non authentifié, ne pas afficher la sélection de rôle
      setShowRoleSelection(false);
    }
  }, [isAuthenticated, hasRoleSelected, userRole, isLoading, segments]);

  const handleRoleSelected = async (role: 'buyer' | 'seller') => {
    try {
      // Sauvegarder le rôle
      await setUserRole(role);

      // Masquer l'écran de sélection
      setShowRoleSelection(false);

      // Rediriger vers l'interface appropriée
      if (role === 'seller') {
        router.replace('/seller/my-shop' as any);
      } else {
        router.replace('/' as any);
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
