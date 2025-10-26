import {
  Palette,
  Shirt,
  Gem,
  Home,
  ImageIcon,
  Scissors,
  Smartphone,
  Apple,
  Sparkles,
  Heart,
  Dumbbell,
  Baby,
  Coffee,
  BookOpen,
  PawPrint,
  Car,
  Flower2,
  Music,
  Paperclip,
  Footprints,
  ShoppingBag,
} from 'lucide-react-native';
import { ComponentType } from 'react';

// Type pour les propriétés des icônes
export type IconProps = {
  size?: number;
  color?: string;
  strokeWidth?: number;
};

// Mapping des catégories vers leurs icônes SVG
export const CATEGORY_ICONS: Record<string, ComponentType<IconProps>> = {
  'Artisanat': Palette,
  'Mode': Shirt,
  'Bijoux': Gem,
  'Décoration': Home,
  'Art': ImageIcon,
  'Textile': Scissors,
  'Électronique': Smartphone,
  'Alimentation': Apple,
  'Beauté': Sparkles,
  'Santé': Heart,
  'Sport': Dumbbell,
  'Enfants': Baby,
  'Maison': Coffee,
  'Livres': BookOpen,
  'Animaux': PawPrint,
  'Automobile': Car,
  'Jardin': Flower2,
  'Musique': Music,
  'Bureautique': Paperclip,
  'Chaussures': Footprints,
  'Tous': ShoppingBag,
};

// Couleurs associées aux catégories pour plus de visualité
export const CATEGORY_COLORS: Record<string, { bg: string; icon: string }> = {
  'Artisanat': { bg: '#FEF3C7', icon: '#D97706' },
  'Mode': { bg: '#DBEAFE', icon: '#2563EB' },
  'Bijoux': { bg: '#FCE7F3', icon: '#DB2777' },
  'Décoration': { bg: '#D1FAE5', icon: '#059669' },
  'Art': { bg: '#E0E7FF', icon: '#6366F1' },
  'Textile': { bg: '#FED7AA', icon: '#EA580C' },
  'Électronique': { bg: '#DBEAFE', icon: '#0284C7' },
  'Alimentation': { bg: '#DCFCE7', icon: '#16A34A' },
  'Beauté': { bg: '#FCE7F3', icon: '#EC4899' },
  'Santé': { bg: '#FEE2E2', icon: '#DC2626' },
  'Sport': { bg: '#DBEAFE', icon: '#3B82F6' },
  'Enfants': { bg: '#FEF9C3', icon: '#EAB308' },
  'Maison': { bg: '#F3E8FF', icon: '#9333EA' },
  'Livres': { bg: '#FED7AA', icon: '#C2410C' },
  'Animaux': { bg: '#FEE2E2', icon: '#EF4444' },
  'Automobile': { bg: '#E0E7FF', icon: '#4F46E5' },
  'Jardin': { bg: '#DCFCE7', icon: '#15803D' },
  'Musique': { bg: '#FCE7F3', icon: '#BE185D' },
  'Bureautique': { bg: '#E0E7FF', icon: '#4338CA' },
  'Chaussures': { bg: '#FED7AA', icon: '#C2410C' },
  'Tous': { bg: '#FFF7ED', icon: '#F97316' },
};

// Fonction helper pour obtenir l'icône d'une catégorie
export const getCategoryIcon = (categoryName: string): ComponentType<IconProps> => {
  return CATEGORY_ICONS[categoryName] || ShoppingBag;
};

// Fonction helper pour obtenir les couleurs d'une catégorie
export const getCategoryColors = (categoryName: string) => {
  return CATEGORY_COLORS[categoryName] || { bg: '#F3F4F6', icon: '#6B7280' };
};
