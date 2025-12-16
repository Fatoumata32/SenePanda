import { useEffect, useState } from 'react';
import { useNavigation as useNavigationContext } from '@/contexts/NavigationContext';
import { useRouter, useSegments, usePathname } from 'expo-router';
import RoleSelectionScreen from './RoleSelectionScreen';

/**
 * Composant qui gère la redirection automatique basée sur le rôle
 * Affiche l'écran de sélection de rôle si nécessaire
 *
 * Logique améliorée:
 * - Les deux rôles peuvent accéder au profil (page commune)
 * - Redirection intelligente basée sur le contexte
 * - Pas de redirection si on est sur une page autorisée
 */
export function RoleRedirect({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hasRoleSelected, userRole, setUserRole, isLoading } = useNavigationContext();
  const router = useRouter();
  const segments = useSegments();
  const pathname = usePathname();
  const [showRoleSelection, setShowRoleSelection] = useState(false);

  // Pages communes accessibles par tous les rôles
  const commonPages = [
    '/(tabs)/profile',
    '/profile',
    '/settings/privacy',
    '/settings/terms',
    '/settings/delete-account',
    '/help-support',
    '/my-benefits',
    '/rewards',
  ];

  // Vérifier si on est sur une page commune
  const isCommonPage = commonPages.some(page => pathname.startsWith(page));

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

        // Si on est sur une page commune, ne pas rediriger
        if (isCommonPage) {
          return;
        }

        // Vérifier dans quelle section on se trouve
        const inTabsSection = segments[0] === '(tabs)';
        const inSellerSection = segments[0] === 'seller';
        const isRootOrHome = pathname === '/' || pathname === '/(tabs)';

        // Logique de redirection basée sur le rôle
        if (userRole === 'seller') {
          // Vendeur : rediriger vers l'interface vendeur si on est dans (tabs) (sauf profil)
          if ((inTabsSection && !isCommonPage) || isRootOrHome) {
            router.replace('/seller/my-shop' as any);
          }
        } else if (userRole === 'buyer') {
          // Acheteur : rediriger vers l'interface acheteur si on est dans seller
          if (inSellerSection) {
            router.replace('/(tabs)' as any);
          }
        }
      }
    } else {
      // Non authentifié, ne pas afficher la sélection de rôle
      setShowRoleSelection(false);
    }
  }, [isAuthenticated, hasRoleSelected, userRole, isLoading, pathname]);

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
