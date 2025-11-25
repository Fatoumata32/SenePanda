import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Locale = 'fr' | 'en';

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LOCALE_STORAGE_KEY = '@senepanda_locale';

// French translations (default)
const translations: Record<Locale, Record<string, string>> = {
  fr: {
    // Common
    'common.loading': 'Chargement...',
    'common.error': 'Une erreur est survenue',
    'common.retry': 'Réessayer',
    'common.cancel': 'Annuler',
    'common.confirm': 'Confirmer',
    'common.save': 'Enregistrer',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.add': 'Ajouter',
    'common.search': 'Rechercher',
    'common.filter': 'Filtrer',
    'common.sort': 'Trier',
    'common.all': 'Tout',
    'common.none': 'Aucun',
    'common.yes': 'Oui',
    'common.no': 'Non',

    // Auth
    'auth.login': 'Connexion',
    'auth.logout': 'Déconnexion',
    'auth.signup': 'Inscription',
    'auth.phone': 'Numéro de téléphone',
    'auth.pin': 'Code PIN',

    // Cart
    'cart.title': 'Panier',
    'cart.empty': 'Votre panier est vide',
    'cart.total': 'Total',
    'cart.checkout': 'Commander',
    'cart.remove': 'Retirer',
    'cart.quantity': 'Quantité',

    // Products
    'product.price': 'Prix',
    'product.stock': 'Stock',
    'product.outOfStock': 'Rupture de stock',
    'product.addToCart': 'Ajouter au panier',
    'product.addedToCart': 'Ajouté au panier',
    'product.reviews': 'Avis',
    'product.description': 'Description',

    // Profile
    'profile.title': 'Profil',
    'profile.settings': 'Paramètres',
    'profile.orders': 'Commandes',
    'profile.favorites': 'Favoris',
    'profile.points': 'Points',

    // Messages
    'messages.title': 'Messages',
    'messages.empty': 'Aucun message',
    'messages.send': 'Envoyer',

    // Notifications
    'notification.success': 'Succès',
    'notification.error': 'Erreur',
    'notification.warning': 'Attention',
    'notification.info': 'Information',
  },
  en: {
    // Common
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'common.retry': 'Retry',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    'common.all': 'All',
    'common.none': 'None',
    'common.yes': 'Yes',
    'common.no': 'No',

    // Auth
    'auth.login': 'Login',
    'auth.logout': 'Logout',
    'auth.signup': 'Sign Up',
    'auth.phone': 'Phone Number',
    'auth.pin': 'PIN Code',

    // Cart
    'cart.title': 'Cart',
    'cart.empty': 'Your cart is empty',
    'cart.total': 'Total',
    'cart.checkout': 'Checkout',
    'cart.remove': 'Remove',
    'cart.quantity': 'Quantity',

    // Products
    'product.price': 'Price',
    'product.stock': 'Stock',
    'product.outOfStock': 'Out of stock',
    'product.addToCart': 'Add to cart',
    'product.addedToCart': 'Added to cart',
    'product.reviews': 'Reviews',
    'product.description': 'Description',

    // Profile
    'profile.title': 'Profile',
    'profile.settings': 'Settings',
    'profile.orders': 'Orders',
    'profile.favorites': 'Favorites',
    'profile.points': 'Points',

    // Messages
    'messages.title': 'Messages',
    'messages.empty': 'No messages',
    'messages.send': 'Send',

    // Notifications
    'notification.success': 'Success',
    'notification.error': 'Error',
    'notification.warning': 'Warning',
    'notification.info': 'Information',
  },
};

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}

interface LocaleProviderProps {
  children: ReactNode;
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>('fr');

  // Load saved locale on mount
  React.useEffect(() => {
    AsyncStorage.getItem(LOCALE_STORAGE_KEY).then((savedLocale) => {
      if (savedLocale && (savedLocale === 'fr' || savedLocale === 'en')) {
        setLocaleState(savedLocale);
      }
    });
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    AsyncStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let translation = translations[locale][key] || translations.fr[key] || key;

    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        translation = translation.replace(`{{${paramKey}}}`, String(value));
      });
    }

    return translation;
  }, [locale]);

  const value = useMemo(() => ({
    locale,
    setLocale,
    t,
  }), [locale, setLocale, t]);

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}
