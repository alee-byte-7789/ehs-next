/**
 * Global font-scale enforcement for the Settings > Display size control.
 *
 * The app can't rely on the OS-level "allowFontScaling" mechanism for this,
 * because that only reacts to the *device's* accessibility text size, not a
 * value the user picks inside our own Settings screen. Instead, we patch
 * RN's `Text` and `TextInput` host components once at startup so that
 * every rendered fontSize is multiplied by whatever scale is currently
 * active — no matter how deep in the tree it lives, and without having to
 * touch every screen's StyleSheet.
 *
 * `setGlobalFontScale` is called from `ThemeProvider` whenever displaySize
 * changes; `patchTextScaling` is called once from `app/_layout.tsx`.
 */
import { cloneElement, isValidElement } from "react";
import { StyleSheet, Text, TextInput } from "react-native";

let currentScale = 1;
let patched = false;

export function setGlobalFontScale(scale: number) {
  currentScale = scale;
}

function scaleStyle(style: unknown): unknown {
  const flat = StyleSheet.flatten(style as never) as
    | (Record<string, unknown> & { fontSize?: number })
    | undefined;
  if (!flat) return style;

  // Default RN Text size is 14 on iOS/Android if none is set explicitly —
  // close enough as a base to scale from when a screen didn't specify one.
  const baseFontSize = typeof flat.fontSize === "number" ? flat.fontSize : 14;
  return [style, { fontSize: baseFontSize * currentScale }];
}

export function patchTextScaling() {
  if (patched) return;
  patched = true;

  const AnyText = Text as unknown as { render: (...args: unknown[]) => unknown };
  const originalTextRender = AnyText.render.bind(Text);
  AnyText.render = function patchedTextRender(props: never, ref: unknown) {
    const origin = originalTextRender(props, ref);
    if (!isValidElement(origin)) return origin;
    const originProps = origin.props as { style?: unknown };
    return cloneElement(origin, { style: scaleStyle(originProps.style) } as never);
  } as never;

  const AnyTextInput = TextInput as unknown as { render: (...args: unknown[]) => unknown };
  const originalInputRender = AnyTextInput.render.bind(TextInput);
  AnyTextInput.render = function patchedInputRender(props: never, ref: unknown) {
    const origin = originalInputRender(props, ref);
    if (!isValidElement(origin)) return origin;
    const originProps = origin.props as { style?: unknown };
    return cloneElement(origin, { style: scaleStyle(originProps.style) } as never);
  } as never;
}
