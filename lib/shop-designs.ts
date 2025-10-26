// Bibliothèque de designs prédéfinis pour les boutiques

export type ShopLogo = {
  id: string;
  icon: string;
  color: string;
  bgColor: string;
};

export type ShopBanner = {
  id: string;
  gradient: string[];
  pattern?: 'dots' | 'waves' | 'grid' | 'diagonal' | 'solid';
};

// Logos prédéfinis avec emojis et couleurs
export const SHOP_LOGOS: ShopLogo[] = [
  { id: 'store-1', icon: '🛍️', color: '#F59E0B', bgColor: '#FEF3C7' },
  { id: 'store-2', icon: '🏪', color: '#EF4444', bgColor: '#FEE2E2' },
  { id: 'store-3', icon: '🏬', color: '#3B82F6', bgColor: '#DBEAFE' },
  { id: 'store-4', icon: '🎨', color: '#8B5CF6', bgColor: '#EDE9FE' },
  { id: 'store-5', icon: '👔', color: '#06B6D4', bgColor: '#CFFAFE' },
  { id: 'store-6', icon: '💎', color: '#10B981', bgColor: '#D1FAE5' },
  { id: 'store-7', icon: '🎭', color: '#EC4899', bgColor: '#FCE7F3' },
  { id: 'store-8', icon: '🌟', color: '#F59E0B', bgColor: '#FEF3C7' },
  { id: 'store-9', icon: '🎪', color: '#EF4444', bgColor: '#FEE2E2' },
  { id: 'store-10', icon: '🏺', color: '#8B5CF6', bgColor: '#EDE9FE' },
  { id: 'store-11', icon: '🎸', color: '#06B6D4', bgColor: '#CFFAFE' },
  { id: 'store-12', icon: '📚', color: '#10B981', bgColor: '#D1FAE5' },
  { id: 'store-13', icon: '🍕', color: '#F59E0B', bgColor: '#FEF3C7' },
  { id: 'store-14', icon: '☕', color: '#78350F', bgColor: '#FED7AA' },
  { id: 'store-15', icon: '🌸', color: '#EC4899', bgColor: '#FCE7F3' },
  { id: 'store-16', icon: '⚽', color: '#3B82F6', bgColor: '#DBEAFE' },
  { id: 'store-17', icon: '🎮', color: '#8B5CF6', bgColor: '#EDE9FE' },
  { id: 'store-18', icon: '📱', color: '#06B6D4', bgColor: '#CFFAFE' },
  { id: 'store-19', icon: '💄', color: '#EC4899', bgColor: '#FCE7F3' },
  { id: 'store-20', icon: '🏠', color: '#10B981', bgColor: '#D1FAE5' },
];

// Bannières prédéfinies avec gradients
export const SHOP_BANNERS: ShopBanner[] = [
  // Solides
  { id: 'banner-1', gradient: ['#F59E0B', '#F59E0B'], pattern: 'solid' },
  { id: 'banner-2', gradient: ['#EF4444', '#EF4444'], pattern: 'solid' },
  { id: 'banner-3', gradient: ['#3B82F6', '#3B82F6'], pattern: 'solid' },
  { id: 'banner-4', gradient: ['#8B5CF6', '#8B5CF6'], pattern: 'solid' },
  { id: 'banner-5', gradient: ['#10B981', '#10B981'], pattern: 'solid' },
  { id: 'banner-6', gradient: ['#EC4899', '#EC4899'], pattern: 'solid' },

  // Gradients 2 couleurs
  { id: 'banner-7', gradient: ['#F59E0B', '#EF4444'], pattern: 'diagonal' },
  { id: 'banner-8', gradient: ['#3B82F6', '#8B5CF6'], pattern: 'diagonal' },
  { id: 'banner-9', gradient: ['#10B981', '#06B6D4'], pattern: 'diagonal' },
  { id: 'banner-10', gradient: ['#EC4899', '#8B5CF6'], pattern: 'diagonal' },
  { id: 'banner-11', gradient: ['#F59E0B', '#EC4899'], pattern: 'diagonal' },
  { id: 'banner-12', gradient: ['#3B82F6', '#10B981'], pattern: 'diagonal' },

  // Gradients vibrants
  { id: 'banner-13', gradient: ['#FCD34D', '#F59E0B', '#EF4444'], pattern: 'waves' },
  { id: 'banner-14', gradient: ['#60A5FA', '#3B82F6', '#8B5CF6'], pattern: 'waves' },
  { id: 'banner-15', gradient: ['#34D399', '#10B981', '#06B6D4'], pattern: 'waves' },
  { id: 'banner-16', gradient: ['#F472B6', '#EC4899', '#8B5CF6'], pattern: 'waves' },

  // Pastels
  { id: 'banner-17', gradient: ['#FEF3C7', '#FED7AA'], pattern: 'dots' },
  { id: 'banner-18', gradient: ['#DBEAFE', '#E0E7FF'], pattern: 'dots' },
  { id: 'banner-19', gradient: ['#D1FAE5', '#CFFAFE'], pattern: 'dots' },
  { id: 'banner-20', gradient: ['#FCE7F3', '#EDE9FE'], pattern: 'dots' },
];

// Fonction helper pour obtenir le gradient CSS
export function getBannerStyle(banner: ShopBanner) {
  if (banner.pattern === 'solid') {
    return {
      background: banner.gradient[0],
    };
  }

  const gradientStr = banner.gradient.join(', ');

  switch (banner.pattern) {
    case 'diagonal':
      return {
        background: `linear-gradient(135deg, ${gradientStr})`,
      };
    case 'waves':
      return {
        background: `linear-gradient(to right, ${gradientStr})`,
      };
    case 'dots':
      return {
        background: `linear-gradient(to bottom right, ${gradientStr})`,
      };
    case 'grid':
      return {
        background: `linear-gradient(90deg, ${gradientStr})`,
      };
    default:
      return {
        background: `linear-gradient(to right, ${gradientStr})`,
      };
  }
}

// Fonction pour obtenir un logo par ID
export function getLogoById(id: string): ShopLogo | undefined {
  return SHOP_LOGOS.find(logo => logo.id === id);
}

// Fonction pour obtenir une bannière par ID
export function getBannerById(id: string): ShopBanner | undefined {
  return SHOP_BANNERS.find(banner => banner.id === id);
}
