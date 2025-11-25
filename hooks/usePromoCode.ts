import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface PromoCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase: number;
  max_uses: number;
  current_uses: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
}

interface PromoValidation {
  isValid: boolean;
  promoCode: PromoCode | null;
  error: string | null;
  discountAmount: number;
}

export function usePromoCode() {
  const [loading, setLoading] = useState(false);

  const validatePromoCode = async (code: string, cartTotal: number): Promise<PromoValidation> => {
    setLoading(true);

    try {
      // Fetch promo code from database
      const { data: promoCode, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !promoCode) {
        return {
          isValid: false,
          promoCode: null,
          error: 'Code promo invalide',
          discountAmount: 0,
        };
      }

      // Check validity dates
      const now = new Date();
      const validFrom = new Date(promoCode.valid_from);
      const validUntil = new Date(promoCode.valid_until);

      if (now < validFrom) {
        return {
          isValid: false,
          promoCode: null,
          error: 'Ce code promo n\'est pas encore valide',
          discountAmount: 0,
        };
      }

      if (now > validUntil) {
        return {
          isValid: false,
          promoCode: null,
          error: 'Ce code promo a expiré',
          discountAmount: 0,
        };
      }

      // Check usage limit
      if (promoCode.max_uses > 0 && promoCode.current_uses >= promoCode.max_uses) {
        return {
          isValid: false,
          promoCode: null,
          error: 'Ce code promo a atteint sa limite d\'utilisation',
          discountAmount: 0,
        };
      }

      // Check minimum purchase
      if (cartTotal < promoCode.min_purchase) {
        return {
          isValid: false,
          promoCode: null,
          error: `Achat minimum de ${promoCode.min_purchase} FCFA requis`,
          discountAmount: 0,
        };
      }

      // Calculate discount
      let discountAmount = 0;
      if (promoCode.discount_type === 'percentage') {
        discountAmount = (cartTotal * promoCode.discount_value) / 100;
      } else {
        discountAmount = promoCode.discount_value;
      }

      // Make sure discount doesn't exceed cart total
      discountAmount = Math.min(discountAmount, cartTotal);

      return {
        isValid: true,
        promoCode,
        error: null,
        discountAmount,
      };
    } catch (error) {
      console.error('Error validating promo code:', error);
      return {
        isValid: false,
        promoCode: null,
        error: 'Erreur lors de la validation du code',
        discountAmount: 0,
      };
    } finally {
      setLoading(false);
    }
  };

  const applyPromoCode = async (promoCodeId: string): Promise<boolean> => {
    try {
      // Increment usage count
      const { error } = await supabase.rpc('increment_promo_usage', {
        promo_id: promoCodeId,
      });

      if (error) {
        console.error('Error applying promo code:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error applying promo code:', error);
      return false;
    }
  };

  const formatDiscount = (promoCode: PromoCode): string => {
    if (promoCode.discount_type === 'percentage') {
      return `-${promoCode.discount_value}%`;
    }
    return `-${promoCode.discount_value} FCFA`;
  };

  return {
    loading,
    validatePromoCode,
    applyPromoCode,
    formatDiscount,
  };
}
