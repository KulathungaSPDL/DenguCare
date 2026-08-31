import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';

interface Props {
  size?: number;
  animated?: boolean;
}

/**
 * DenguCare's brand mark: a heart-and-cross emblem in a seal ring, used for
 * the app's most prominent brand moment (the welcome screen). Same palette
 * as the rest of the app - just a clean, non-mascot vector logo rather than
 * an illustrated character, so it reads as a wordmark, not a mascot.
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

        {/* outer seal ring - reads as an emblem/badge rather than a character */}
        <Circle cx="50" cy="46" r="47" fill="none" stroke="#FFFFFF" strokeOpacity={0.28} strokeWidth={1.5} />
        <Circle cx="50" cy="46" r="41" fill="none" stroke="#FFFFFF" strokeOpacity={0.16} strokeWidth={1} />

        {/* heart body */}
        <Path
          d="M50 90 C50 90 12 65 12 36 C12 18 26 8 40 8 C46 8 50 12 50 18 C50 12 54 8 60 8 C74 8 88 18 88 36 C88 65 50 90 50 90 Z"
          fill="url(#heartBody)"
        />

        {/* gloss highlight */}
        <Ellipse cx="32" cy="34" rx="9" ry="14" fill="#FFFFFF" opacity={0.28} />

        {/* medical cross, centered - the emblem's focal mark */}
        <Path
          d="M45 26 L55 26 L55 36 L65 36 L65 46 L55 46 L55 56 L45 56 L45 46 L35 46 L35 36 L45 36 Z"
          fill="#FFFFFF"
          opacity={0.96}
        />
      </Svg>
    </Animated.View>
  );
}
