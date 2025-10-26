import { View, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

type WaveDividerProps = {
  backgroundColor?: string;
  waveColor?: string;
  height?: number;
};

export default function WaveDivider({
  backgroundColor = '#FFFACD',
  waveColor = '#FFFFFF',
  height = 60
}: WaveDividerProps) {
  return (
    <View style={[styles.container, { height }]}>
      <Svg
        height="100%"
        width="100%"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none">
        <Defs>
          {/* Gradient vertical pour transition douce */}
          <SvgLinearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={backgroundColor} stopOpacity="1" />
            <Stop offset="1" stopColor={waveColor} stopOpacity="1" />
          </SvgLinearGradient>
        </Defs>

        {/* Fond avec gradient */}
        <Path
          fill="url(#waveGradient)"
          d="M0,0 L1440,0 L1440,120 L0,120 Z"
        />

        {/* Vague blanche - courbe douce et naturelle */}
        <Path
          fill={waveColor}
          d="M0,40 Q360,20 720,40 T1440,40 L1440,120 L0,120 Z"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginTop: -1,
    marginBottom: -1,
  },
});
