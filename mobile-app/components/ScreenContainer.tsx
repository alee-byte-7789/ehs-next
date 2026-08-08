import { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../lib/auth-context";
import { useAppTheme } from "../lib/theme/theme-context";
import { DesktopSidebar } from "./DesktopSidebar";

interface ScreenContainerProps {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: ("top" | "bottom" | "left" | "right")[];
  /** Opt out of the desktop sidebar (login, register, first-run screens). */
  withSidebar?: boolean;
}

/**
 * The app is phone-first, but on a desktop browser a phone layout stretched
 * across a 1920px window looks like a phone app someone opened in a browser
 * — which it did.
 *
 * So above DESKTOP_BREAKPOINT this renders a permanent expanded sidebar and
 * puts the screen content beside it, instead of hiding navigation behind a
 * hamburger. Below the breakpoint nothing changes: same hamburger, same
 * centred column.
 *
 * This lives in ScreenContainer deliberately — all 15 screens already use
 * it, so the desktop layout applies everywhere without touching each screen.
 */
const DESKTOP_BREAKPOINT = 1024;
const MAX_CONTENT_WIDTH = 640;

export function ScreenContainer({
  children,
  scroll = true,
  padded = true,
  edges = ["top", "bottom", "left", "right"],
  withSidebar = true,
}: ScreenContainerProps) {
  const { colors } = useAppTheme();
  const { status } = useAuth();
  const { width } = useWindowDimensions();

  // Only signed-in users get the sidebar: it navigates to authenticated
  // screens and shows the resident's own name, so it makes no sense on the
  // login or registration screens.
  const showSidebar =
    withSidebar && Platform.OS === "web" && width >= DESKTOP_BREAKPOINT && status === "signed-in";

  // Branch on the ELEMENT, never on the component type.
  //
  // This previously did `const Content = scroll ? ScrollView : (props) => ...`,
  // defining an arrow component inline during render. That creates a NEW
  // component type on every render, so React unmounted and remounted the
  // entire subtree each time — which destroyed any focused TextInput
  // mid-keystroke and made non-scrolling forms impossible to type into.
  // It also silently dropped contentContainerStyle, since a fragment cannot
  // accept one, so those screens lost their padding and width cap too.
  const body = (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={padded ? styles.content : styles.contentFlush}
          style={styles.flex}
          showsVerticalScrollIndicator={false}
          // Without this a ScrollView eats the first tap while the keyboard
          // is open, so tapping straight from one field to another just
          // dismisses the keyboard instead of moving focus.
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, padded ? styles.content : styles.contentFlush]}>{children}</View>
      )}
    </KeyboardAvoidingView>
  );

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={edges}>
      <StatusBar barStyle={colors.statusBarStyle === "dark" ? "dark-content" : "light-content"} />
      {showSidebar ? (
        <View style={styles.desktopRow}>
          <DesktopSidebar />
          <View style={styles.flex}>{body}</View>
        </View>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  desktopRow: { flex: 1, flexDirection: "row" },
  content: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: "center",
  },
  contentFlush: {
    flexGrow: 1,
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: "center",
  },
});
