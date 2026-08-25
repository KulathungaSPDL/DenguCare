import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';

interface Props {
  size?: number;
  animated?: boolean;
}

/**
 * "Cari" — DenguCare's heart-badge mascot: a caring heart with a friendly
 * face and a small cross pin, used for prominent brand moments (welcome
 * screen) where a full droplet character reads as too playful/large.
 */
export function CareBadge({ size = 112, animated = true }: Props) {
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return undefined;
    const bobLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    bobLoop.start();
    return () => bobLoop.stop();
  }, [animated, bob]);

  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });
  const scale = bob.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] });

  return (
    <Animated.View style={{ width: size, height: size, transform: [{ translateY }, { scale }] }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="heartBody" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#4CC3C1" />
            <Stop offset="55%" stopColor="#115C5C" />
            <Stop offset="100%" stopColor="#0B4444" />
          </LinearGradient>
        </Defs>

        {/* soft ground shadow */}
        <Ellipse cx="50" cy="93" rx="26" ry="5" fill="#0B2A2A" opacity={0.12} />

        {/* sparkle accents */}
        <Path d="M14 24 L16 30 L22 32 L16 34 L14 40 L12 34 L6 32 L12 30 Z" fill="#4CC3C1" opacity={0.7} />
        <Circle cx="86" cy="20" r="3" fill="#4CC3C1" opacity={0.6} />

        {/* heart body */}
        <Path
          d="M50 90 C50 90 12 65 12 36 C12 18 26 8 40 8 C46 8 50 12 50 18 C50 12 54 8 60 8 C74 8 88 18 88 36 C88 65 50 90 50 90 Z"
          fill="url(#heartBody)"
        />

        {/* gloss highlight */}
        <Ellipse cx="32" cy="34" rx="9" ry="14" fill="#FFFFFF" opacity={0.32} />

        {/* face */}
        <Circle cx="41" cy="46" r="3.2" fill="#0F2E2E" />
        <Circle cx="59" cy="46" r="3.2" fill="#0F2E2E" />
        <Path d="M40 55 Q50 63 60 55" stroke="#0F2E2E" strokeWidth={2.8} strokeLinecap="round" fill="none" />

        {/* blush */}
        <Ellipse cx="33" cy="53" rx="4.5" ry="2.8" fill="#FF9E8A" opacity={0.5} />
        <Ellipse cx="67" cy="53" rx="4.5" ry="2.8" fill="#FF9E8A" opacity={0.5} />

        {/* small care badge pin */}
        <Circle cx="50" cy="72" r="12" fill="#FFFFFF" opacity={0.95} />
        <Path d="M50 66 L50 78 M44 72 L56 72" stroke="#115C5C" strokeWidth={3.4} strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
}
