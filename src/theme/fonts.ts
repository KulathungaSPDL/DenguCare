import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_800ExtraBold_Italic,
} from '@expo-google-fonts/inter';
import { JetBrainsMono_500Medium, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';

// Passed straight into useFonts() in app/_layout.tsx. Keys must match the
// family names referenced by src/theme/typography.ts's fontFamily tokens.
export const GOOGLE_FONTS_TO_LOAD = {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_800ExtraBold_Italic,
  JetBrainsMono_500Medium,
  JetBrainsMono_700Bold,
};
