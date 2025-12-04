import { View, Text, StyleSheet } from 'react-native';
import { Sparkles, Flame, Heart, Star, Trophy, ThumbsUp, ShieldCheck, BadgeCheck, Award, Verified } from 'lucide-react-native';
import { memo } from 'react';

type BadgeType = 'Nouveau' | 'Tendance' | 'Pour vous' | 'Très bien noté' | 'Populaire' | 'Recommandé' | 'Vérifié' | 'Confiance' | 'Top Vendeur' | 'Certifié';

interface RecommendationBadgeProps {
  type: BadgeType | string;
  size?: 'small' | 'medium' | 'large';
}

const badgeConfig: Record<string, { Icon: any; bgColor: string; iconColor: string; textColor: string }> = {
  'Nouveau': { Icon: Sparkles, bgColor: '#D1FAE5', iconColor: '#059669', textColor: '#059669' },
  'Tendance': { Icon: Flame, bgColor: '#FEE2E2', iconColor: '#DC2626', textColor: '#DC2626' },
  'Pour vous': { Icon: Heart, bgColor: '#EDE9FE', iconColor: '#7C3AED', textColor: '#7C3AED' },
  'Très bien noté': { Icon: Star, bgColor: '#FEF3C7', iconColor: '#D97706', textColor: '#D97706' },
  'Populaire': { Icon: Trophy, bgColor: '#DBEAFE', iconColor: '#2563EB', textColor: '#2563EB' },
  'Recommandé': { Icon: ThumbsUp, bgColor: '#F3F4F6', iconColor: '#6B7280', textColor: '#6B7280' },
  // Badges de confiance
  'Vérifié': { Icon: BadgeCheck, bgColor: '#DBEAFE', iconColor: '#1D4ED8', textColor: '#1D4ED8' },
  'Confiance': { Icon: ShieldCheck, bgColor: '#D1FAE5', iconColor: '#047857', textColor: '#047857' },
  'Top Vendeur': { Icon: Award, bgColor: '#FEF3C7', iconColor: '#B45309', textColor: '#B45309' },
  'Certifié': { Icon: ShieldCheck, bgColor: '#EDE9FE', iconColor: '#6D28D9', textColor: '#6D28D9' },
};

const sizeConfig = {
  small: { iconSize: 10, fontSize: 9, paddingH: 6, paddingV: 3, radius: 10 },
  medium: { iconSize: 12, fontSize: 11, paddingH: 8, paddingV: 4, radius: 12 },
  large: { iconSize: 14, fontSize: 13, paddingH: 10, paddingV: 5, radius: 14 },
};

function RecommendationBadge({ type, size = 'small' }: RecommendationBadgeProps) {
  const config = badgeConfig[type] || badgeConfig['Recommandé'];
  const sizeStyle = sizeConfig[size];
  const IconComponent = config.Icon;

  return (
    <View style={[
      styles.badge,
      {
        backgroundColor: config.bgColor,
        paddingHorizontal: sizeStyle.paddingH,
        paddingVertical: sizeStyle.paddingV,
        borderRadius: sizeStyle.radius,
      }
    ]}>
      <IconComponent size={sizeStyle.iconSize} color={config.iconColor} strokeWidth={2.5} />
      <Text style={[styles.text, { color: config.textColor, fontSize: sizeStyle.fontSize }]}>{type}</Text>
    </View>
  );
}

export default memo(RecommendationBadge);

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  text: {
    fontWeight: '700',
  },
});
