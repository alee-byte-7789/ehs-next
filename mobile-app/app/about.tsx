import { router } from "expo-router";
import { ActivityIndicator, Image, StyleSheet, View } from "react-native";
import { AppText as Text } from "../components/ui/AppText";

import { Card } from "../components/ui/Card";
import { Pressable } from "../components/ui/Pressable";
import { ScreenContainer } from "../components/ScreenContainer";
import { ScreenHeader } from "../components/ui/ScreenHeader";
import { useSocietyInfo } from "../lib/society-queries";
import { useAppTheme } from "../lib/theme/theme-context";

export default function AboutScreen() {
  const { colors } = useAppTheme();
  const { data: info, isLoading } = useSocietyInfo();

  return (
    <ScreenContainer>
      <ScreenHeader title="About" subtitle="EHS Next" />

      <View style={styles.logoWrap}>
        <Image source={require("../assets/icon.png")} style={styles.logo} resizeMode="contain" />
        <Text style={[styles.appName, { color: colors.textPrimary }]}>EHS Next</Text>
        <Text style={[styles.version, { color: colors.textTertiary }]}>Version 1.0.0</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
      ) : (
        <>
          {info?.about_text ? (
            <Card style={styles.card}>
              <Text style={[styles.bodyText, { color: colors.textSecondary }]}>{info.about_text}</Text>
            </Card>
          ) : null}

          {info?.chairman_name ? (
            <Card style={styles.card}>
              <Text style={[styles.role, { color: colors.primary }]}>Chairman</Text>
              <Text style={[styles.personName, { color: colors.textPrimary }]}>{info.chairman_name}</Text>
              {info.chairman_message ? (
                <Text style={[styles.bodyText, { color: colors.textSecondary }]}>{info.chairman_message}</Text>
              ) : null}
            </Card>
          ) : null}

          {info?.secretary_name ? (
            <Card style={styles.card}>
              <Text style={[styles.role, { color: colors.primary }]}>
                {info.secretary_designation ?? "Secretary"}
              </Text>
              <Text style={[styles.personName, { color: colors.textPrimary }]}>{info.secretary_name}</Text>
              {info.secretary_message ? (
                <Text style={[styles.bodyText, { color: colors.textSecondary }]}>{info.secretary_message}</Text>
              ) : null}
            </Card>
          ) : null}
        </>
      )}

      <Pressable onPress={() => router.back()} style={styles.backRow}>
        <Text style={{ color: colors.primary, fontSize: 14, fontWeight: "600" }}>Back</Text>
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  logoWrap: { alignItems: "center", marginBottom: 24, marginTop: 8 },
  logo: { width: 72, height: 72, marginBottom: 10 },
  appName: { fontSize: 20, fontWeight: "700" },
  version: { fontSize: 12, marginTop: 2 },
  card: { marginBottom: 12, gap: 4 },
  role: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  personName: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  bodyText: { fontSize: 13, lineHeight: 19 },
  backRow: { alignItems: "center", marginTop: 12, marginBottom: 20 },
});
