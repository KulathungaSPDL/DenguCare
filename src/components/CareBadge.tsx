import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  size?: number;
  animated?: boolean;
}

/**
 * DenguCare's brand mark: a shield-and-cross emblem in a seal ring, used for
 * the app's most prominent brand moment (the welcome screen). Same palette
 * as the rest of the app - just a clean, non-mascot vector logo rather than
 * an illustrated character, so it reads as a wordmark, not a mascot.
 */
export function CareBadge({ size = 112, animated = true }: Props) {
  const bob = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return undefined;
    const bobLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ])
    );
    bobLoop.start();
    glowLoop.start();
    return () => {
      bobLoop.stop();
      glowLoop.stop();
    };
  }, [animated, bob, glow]);

  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -5] });
  const scale = bob.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] });
  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.85] });
  const glowRadius = glow.interpolate({ inputRange: [0, 1], outputRange: [44, 50] });

  return (
    <Animated.View style={{ width: size, height: size, transform: [{ translateY }, { scale }] }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="shieldBody" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#E8776A" />
            <Stop offset="55%" stopColor="#B3382C" />
            <Stop offset="100%" stopColor="#7A2015" />
          </LinearGradient>
          <RadialGradient id="shieldGlow" cx="50%" cy="46%" r="55%">
            <Stop offset="0%" stopColor="#FFD9A8" stopOpacity={0.8} />
            <Stop offset="45%" stopColor="#FF8A5C" stopOpacity={0.35} />
            <Stop offset="100%" stopColor="#FF8A5C" stopOpacity={0} />
          </RadialGradient>
        </Defs>

        {/* soft ground shadow */}
        <Ellipse cx="50" cy="95" rx="26" ry="5" fill="#0B2A2A" opacity={0.12} />

        {/* pulsing lighting glow behind the shield */}
        <AnimatedCircle cx="50" cy="46" r={glowRadius} fill="url(#shieldGlow)" opacity={glowOpacity} />

        {/* outer seal ring - reads as an emblem/badge rather than a character */}
        <Circle cx="50" cy="48" r="47" fill="none" stroke="#FFFFFF" strokeOpacity={0.28} strokeWidth={1.5} />
        <Circle cx="50" cy="48" r="41" fill="none" stroke="#FFFFFF" strokeOpacity={0.16} strokeWidth={1} />

        {/* shield body - peaked top, flared shoulders, tapering to a point */}
        <Path
          d="M50 8 L83 22 C83 22 85 60 71 76 C63 85 50 92 50 92 C50 92 37 85 29 76 C15 60 17 22 17 22 Z"
          fill="url(#shieldBody)"
        />

        {/* gloss highlight - bright streak simulating a light source top-left */}
        <Ellipse cx="34" cy="36" rx="9" ry="16" fill="#FFFFFF" opacity={0.28} />
        <Path d="M42 12 L50 8 L58 12 L46 30 Z" fill="#FFFFFF" opacity={0.22} />

        {/* medical cross, centered - the emblem's focal mark */}
        <Path
          d="M45 33 L55 33 L55 43 L65 43 L65 53 L55 53 L55 63 L45 63 L45 53 L35 53 L35 43 L45 43 Z"
          fill="#FFFFFF"
          opacity={0.96}
        />
      </Svg>
    </Animated.View>
  );
}
