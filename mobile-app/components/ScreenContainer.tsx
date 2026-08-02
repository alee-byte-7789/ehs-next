import { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAppTheme } from "../lib/theme/theme-context";

interface ScreenContainerProps {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: ("top" | "bottom" | "left" | "right")[];
}

export function ScreenContainer({
  children,
  scroll = true,
  padded = true,
  edges = ["top", "bottom", "left", "right"],
}: ScreenContainerProps) {
  const { colors } = useAppTheme();
  const Content = scroll ? ScrollView : (props: { children: ReactNode; style?: any }) => (
    <>{props.children}</>
  );

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.background }]} edges={edges}>
      <StatusBar barStyle={colors.statusBarStyle === "dark" ? "dark-content" : "light-content"} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Content
          contentContainerStyle={padded ? styles.content : styles.contentFlush}
          style={styles.flex}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </Content>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  contentFlush: {
    flexGrow: 1,
  },
});
