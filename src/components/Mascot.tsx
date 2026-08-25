import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, Stop } from 'react-native-svg';

import { colors } from '../theme/colors';

export type MascotMood = 'happy' | 'waving' | 'shield' | 'sleepy' | 'concerned';

interface Props {
  mood?: MascotMood;
  size?: number;
  /** Disable the idle bob/wave loop, e.g. inside a list of many mascots. */
  animated?: boolean;
}

/**
 * "Dengu" - DenguCare's droplet mascot. A friendly hydration drop with a face,
 * reused across empty states, onboarding and safety moments so the app has one
 * consistent, cute character instead of ad-hoc icons.
 */
export function Mascot({ mood = 'happy', size = 96, animated = true }: Props) {
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return undefined;
    const bobLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    bobLoop.start();
    return () => bobLoop.stop();
  }, [animated, bob]);

  const translateY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -6] });

  return (
    <Animated.View style={{ width: size, height: size, transform: [{ translateY }] }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <LinearGradient id="dropBody" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#4CC3C1" />
            <Stop offset="55%" stopColor={colors.primary} />
            <Stop offset="100%" stopColor={colors.primaryDark} />
          </LinearGradient>
        </Defs>

        {/* soft ground shadow */}
        <Ellipse cx="50" cy="92" rx="24" ry="5" fill={colors.shadow} opacity={0.12} />

        {/* waving arm, drawn behind the body so only the hand peeks out */}
        {mood === 'waving' ? (
          <>
            <Path d="M30 58 Q14 50 16 36" stroke={colors.primaryDark} strokeWidth={7} strokeLinecap="round" fill="none" />
            <Circle cx="16" cy="34" r="6" fill="#4CC3C1" />
          </>
        ) : null}

        {/* body */}
        <Path
          d="M50 8 C68 34 82 52 82 68 C82 85 67 95 50 95 C33 95 18 85 18 68 C18 52 32 34 50 8 Z"
          fill="url(#dropBody)"
        />

        {/* gloss highlight */}
        <Ellipse cx="37" cy="42" rx="8" ry="14" fill="#FFFFFF" opacity={0.35} />

        {mood === 'shield' ? (
          <Path
            d="M50 46 L64 51 C64 65 58 74 50 78 C42 74 36 65 36 51 Z"
            fill="#FFFFFF"
            opacity={0.9}
            stroke={colors.primaryDark}
            strokeWidth={1.5}
          />
        ) : null}
        {mood === 'shield' ? (
          <Path d="M44 63 L48 68 L57 57" stroke={colors.primary} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        ) : null}

        {/* face */}
        {mood === 'sleepy' ? (
          <>
            <Path d="M40 62 q4 4 8 0" stroke="#0F2E2E" strokeWidth={2.5} strokeLinecap="round" fill="none" />
            <Path d="M56 62 q4 4 8 0" stroke="#0F2E2E" strokeWidth={2.5} strokeLinecap="round" fill="none" />
          </>
        ) : mood === 'concerned' ? (
          <>
            <Circle cx="43" cy="61" r="3.4" fill="#0F2E2E" />
            <Circle cx="61" cy="61" r="3.4" fill="#0F2E2E" />
            <Path d="M39 54 L47 57" stroke="#0F2E2E" strokeWidth={2} strokeLinecap="round" />
            <Path d="M65 54 L57 57" stroke="#0F2E2E" strokeWidth={2} strokeLinecap="round" />
          </>
        ) : (
          <>
            <Circle cx="43" cy="61" r="3.4" fill="#0F2E2E" />
            <Circle cx="61" cy="61" r="3.4" fill="#0F2E2E" />
          </>
        )}

        {mood === 'concerned' ? (
          <Ellipse cx="52" cy="73" rx="3.5" ry="4.5" fill="#0F2E2E" />
        ) : mood === 'sleepy' ? null : (
          <Path d="M42 71 Q52 80 62 71" stroke="#0F2E2E" strokeWidth={2.8} strokeLinecap="round" fill="none" />
        )}

        {/* blush */}
        {mood === 'happy' || mood === 'waving' ? (
          <>
            <Ellipse cx="35" cy="70" rx="5" ry="3" fill="#FF9E8A" opacity={0.55} />
            <Ellipse cx="69" cy="70" rx="5" ry="3" fill="#FF9E8A" opacity={0.55} />
          </>
        ) : null}
      </Svg>
    </Animated.View>
  );
}
