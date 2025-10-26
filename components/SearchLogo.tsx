import Svg, { Path, Circle } from 'react-native-svg';
import { Colors } from '@/constants/Colors';

type SearchLogoProps = {
  size?: number;
  color?: string;
};

export default function SearchLogo({ size = 18, color = Colors.white }: SearchLogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Loupe - cercle */}
      <Circle
        cx="11"
        cy="11"
        r="7"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Loupe - manche */}
      <Path
        d="M16 16L21 21"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}
