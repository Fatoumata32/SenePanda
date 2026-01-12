import { useEffect, useState } from 'react';
import { useNavigation as useNavigationContext } from '@/contexts/NavigationContext';
import { useRouter, usePathname } from 'expo-router';

/**
 * Composant qui gère la redirection automatique après connexion
 * 
 * Logique simplifiée:
 * - Plus de page de sélection de rôle
 * - Redirection directe vers home après connexion
 * - Si pas de rôle, définir "buyer" par défaut
 */
export function RoleRedirect({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hasRoleSelected, userRole, setUserRole, isLoading } = useNavigationContext();
  const router = useRouter();
  const pathname = usePathname();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    // L'utilisateur est authentifié
    if (isAuthenticated) {
      // Si pas de rôle sélectionné, définir "buyer" par défaut automatiquement
      if (!hasRoleSelected || !userRole) {
        // Définir buyer par défaut sans afficher l'écran de sélection
        setUserRole('buyer').then(() => {
          console.log('✅ Rôle buyer défini par défaut');
          // Rediriger vers home
          if (!hasRedirected) {
            setHasRedirected(true);
            router.replace('/(tabs)/home' as any);
          }
        }).catch((error) => {
          console.error('Erreur définition rôle:', error);
          // Rediriger quand même vers home
          if (!hasRedirected) {
            setHasRedirected(true);
            router.replace('/(tabs)/home' as any);
          }
        });
      } else {
        // Le rôle est déjà sélectionné - rediriger vers home si nécessaire
        if (!hasRedirected && (pathname === '/' || pathname === '/(tabs)' || pathname === '/role-selection')) {
          setHasRedirected(true);
          router.replace('/(tabs)/home' as any);
        }
      }
    } else {
      // Non authentifié
      setHasRedirected(false);
    }
  }, [isAuthenticated, hasRoleSelected, userRole, isLoading, pathname, hasRedirected]);

  // Toujours afficher le contenu normal (plus d'écran de sélection)
  return <>{children}</>;
}
