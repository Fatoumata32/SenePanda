/**
 * Service de navigation centralisé
 * Gère toutes les redirections et la logique de navigation
 */

import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types de routes
export type PublicRoute =
  | '/(tabs)/profile'
  | '/(tabs)/index'
  | '/register'
  | '/role-selection';

export type ProtectedRoute =
  | '/(tabs)/explore'
  | '/(tabs)/favorites'
  | '/(tabs)/messages'
  | '/orders'
  | '/checkout'
  | '/seller/setup'
  | '/seller/products'
  | '/seller/orders';

export type Route = PublicRoute | ProtectedRoute;

// Routes qui nécessitent une authentification
const PROTECTED_ROUTES: ProtectedRoute[] = [
  '/(tabs)/explore',
  '/(tabs)/favorites',
  '/(tabs)/messages',
  '/orders',
  '/checkout',
  '/seller/setup',
  '/seller/products',
  '/seller/orders',
];

// Routes accessibles sans authentification
const PUBLIC_ROUTES: PublicRoute[] = [
  '/(tabs)/profile',
  '/(tabs)/index',
  '/register',
  '/role-selection',
];

// Routes qui nécessitent la sélection du rôle
const ROLE_REQUIRED_ROUTES: string[] = [
  '/(tabs)/explore',
  '/(tabs)/favorites',
  '/(tabs)/messages',
  '/seller/setup',
  '/seller/products',
  '/seller/orders',
];

export class NavigationService {
  private static redirectAfterLogin: Route | null = null;

  /**
   * Vérifie si une route est protégée
   */
  static isProtectedRoute(path: string): boolean {
    return PROTECTED_ROUTES.some(route => path.includes(route));
  }

  /**
   * Vérifie si une route est publique
   */
  static isPublicRoute(path: string): boolean {
    return PUBLIC_ROUTES.some(route => path.includes(route));
  }

  /**
   * Vérifie si une route nécessite la sélection du rôle
   */
  static requiresRoleSelection(path: string): boolean {
    return ROLE_REQUIRED_ROUTES.some(route => path.includes(route));
  }

  /**
   * Sauvegarde la route pour redirection après login
   */
  static setRedirectAfterLogin(route: Route) {
    this.redirectAfterLogin = route;
  }

  /**
   * Récupère et efface la route de redirection
   */
  static getAndClearRedirect(): Route | null {
    const redirect = this.redirectAfterLogin;
    this.redirectAfterLogin = null;
    return redirect;
  }

  /**
   * Navigue vers la page de connexion
   */
  static goToLogin(redirectTo?: Route) {
    if (redirectTo) {
      this.setRedirectAfterLogin(redirectTo);
    }
    router.replace('/(tabs)/profile');
  }

  /**
   * Navigue vers la sélection du rôle
   */
  static goToRoleSelection() {
    router.replace('/role-selection');
  }

  /**
   * Navigue vers l'accueil
   */
  static goToHome() {
    router.replace('/(tabs)/index' as any);
  }

  /**
   * Navigue après un login réussi
   */
  static async handlePostLogin() {
    try {
      // Vérifier si le rôle a été sélectionné
      const roleSelected = await AsyncStorage.getItem('user_preferred_role');

      // Si une redirection est enregistrée, y aller
      const redirect = this.getAndClearRedirect();
      if (redirect) {
        // Si le rôle n'est pas sélectionné et la route le nécessite, aller à role-selection
        if (!roleSelected && this.requiresRoleSelection(redirect)) {
          this.goToRoleSelection();
        } else {
          router.replace(redirect as any);
        }
        return;
      }

      // Sinon, logique par défaut
      if (!roleSelected) {
        this.goToRoleSelection();
      } else {
        this.goToHome();
      }
    } catch (error) {
      console.error('Error in handlePostLogin:', error);
      this.goToHome();
    }
  }

  /**
   * Navigue après un logout
   */
  static handlePostLogout() {
    // Effacer le rôle sauvegardé
    AsyncStorage.removeItem('user_preferred_role').catch(console.error);
    // Rediriger vers login
    router.replace('/(tabs)/profile');
  }

  /**
   * Vérifie et gère la navigation selon l'état d'auth
   */
  static async handleNavigation(
    currentPath: string,
    isAuthenticated: boolean
  ): Promise<boolean> {
    try {
      // Si l'utilisateur n'est pas authentifié
      if (!isAuthenticated) {
        // Autoriser les pages publiques
        if (this.isPublicRoute(currentPath)) {
          return true;
        }
        // Rediriger vers login pour les pages protégées
        this.goToLogin(currentPath as Route);
        return false;
      }

      // Si l'utilisateur est authentifié
      const roleSelected = await AsyncStorage.getItem('user_preferred_role');

      // Si sur la page de login alors qu'on est connecté, rediriger
      if (currentPath.includes('/(tabs)/profile') && isAuthenticated) {
        await this.handlePostLogin();
        return false;
      }

      // Si le rôle n'est pas sélectionné et la route le nécessite
      if (!roleSelected && this.requiresRoleSelection(currentPath)) {
        if (!currentPath.includes('role-selection')) {
          this.goToRoleSelection();
          return false;
        }
      }

      // Si sur role-selection avec un rôle déjà sélectionné, rediriger
      if (roleSelected && currentPath.includes('role-selection')) {
        this.goToHome();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in handleNavigation:', error);
      return true;
    }
  }

  /**
   * Navigation sécurisée vers une route
   */
  static async navigateTo(route: Route, isAuthenticated: boolean) {
    // Si route protégée et non authentifié
    if (this.isProtectedRoute(route) && !isAuthenticated) {
      this.goToLogin(route);
      return;
    }

    // Si authentifié, vérifier le rôle
    if (isAuthenticated && this.requiresRoleSelection(route)) {
      const roleSelected = await AsyncStorage.getItem('user_preferred_role');
      if (!roleSelected) {
        this.setRedirectAfterLogin(route);
        this.goToRoleSelection();
        return;
      }
    }

    // Navigation normale
    router.push(route as any);
  }

  /**
   * Retour arrière intelligent
   */
  static goBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      this.goToHome();
    }
  }
}

export default NavigationService;
