/**
 * Drop-in replacement for RN's `Text`. Handles three things the plain
 * component can't:
 *
 * 1. DISPLAY SIZE — applies the Settings > Display scale to fontSize AND
 *    lineHeight. Scaling only fontSize (the previous behaviour) made lines
 *    collide at Large/Extra Large, because the line box stayed the same
 *    height while the glyphs grew.
 *
 * 2. FONT WEIGHT — React Native does not reliably synthesise bold for a
 *    custom font, so each weight is a separate loaded file and the style's
 *    `fontWeight` is mapped onto the matching family name.
 *
 * 3. SCRIPT FALLBACK — Barlow Semi Condensed has ZERO Arabic/Urdu glyph
 *    coverage (verified: 0 codepoints in U+0600..U+06FF). Forcing it onto
 *    Urdu or Arabic strings would render them as empty boxes. Any string
 *    containing Arabic-range characters is therefore left on the system
 *    font, which does render those scripts. This is per-Text, which is
 *    granular enough: Urdu UI labels and the Arabic prayer names each live
 *    in their own Text element.
 */
import { forwardRef, type ReactNode } from "react";
import {
  StyleSheet,
  Text as RNText,
  type Text as RNTextInstance,
  type TextProps,
  type TextStyle,
} from "react-native";

import { useAppTheme } from "../../lib/theme/theme-context";

/** Arabic, Arabic Supplement, Extended-A, and the presentation forms. */
const ARABIC_RANGE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

/** Minimum clear space between the glyph box and the line box. */
const MIN_LINE_GAP = 4;

function containsArabicScript(node: ReactNode): boolean {
  if (typeof node === "string") return ARABIC_RANGE.test(node);
  if (typeof node === "number") return false;
  if (Array.isArray(node)) return node.some(containsArabicScript);
  return false;
}

/** Maps a React Native fontWeight onto one of the four loaded Barlow files. */
function barlowFamilyFor(weight: TextStyle["fontWeight"]): string {
  const w = String(weight ?? "400");
  if (w === "bold" || w === "700" || w === "800" || w === "900") return "Barlow-Bold";
  if (w === "600") return "Barlow-SemiBold";
  if (w === "500") return "Barlow-Medium";
  return "Barlow-Regular";
}

export const AppText = forwardRef<RNTextInstance, TextProps>(function AppText(
  { style, children, ...props },
  ref
) {
  const { fontScale } = useAppTheme();

  const flat = (StyleSheet.flatten(style) ?? {}) as TextStyle;

  const baseFontSize = typeof flat.fontSize === "number" ? flat.fontSize : 14;
  const scaledFontSize = baseFontSize * fontScale;

  const declaredLineHeight = typeof flat.lineHeight === "number" ? flat.lineHeight : null;
  const scaledLineHeight =
    declaredLineHeight !== null ? declaredLineHeight * fontScale : scaledFontSize * 1.35;

  // Leave Arabic/Urdu on the system font; it has the glyphs and Barlow
  // does not. Also respect an explicit fontFamily if a caller set one.
  const useSystemFont = containsArabicScript(children) || Boolean(flat.fontFamily);

  return (
    <RNText
      ref={ref}
      {...props}
      style={[
        style,
        {
          fontSize: scaledFontSize,
          lineHeight: Math.max(scaledLineHeight, scaledFontSize + MIN_LINE_GAP),
        },
        !useSystemFont && {
          fontFamily: barlowFamilyFor(flat.fontWeight),
          // The weight now comes from the font FILE. Leaving a numeric
          // fontWeight alongside a custom family makes Android attempt its
          // own synthetic bolding on top, which looks smeared.
          fontWeight: undefined,
        },
      ]}
    >
      {children}
    </RNText>
  );
});
