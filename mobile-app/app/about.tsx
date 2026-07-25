import { router } from "expo-router";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSocietyInfo } from "../lib/society-queries";
import { radii, spacing } from "../lib/theme";
import { useTheme } from "../lib/use-theme";

export default function AboutScreen() {
  const theme = useTheme();
  const { data: info, isLoading } = useSocietyInfo();

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ color: theme.primary, fontSize: 15 }}>← Back</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.textPrimary }]}>About EHS</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Image source={require("../assets/logo-full.png")} style={styles.logo} resizeMode="contain" />
        {isLoading && <Text style={{ color: theme.textSecondary }}>Loading...</Text>}

        {info && (
          <>
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.body, { color: theme.textPrimary }]}>{info.about_text}</Text>
            </View>

            {info.chairman_name && (
              <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Chairman</Text>
                <Text style={[styles.personName, { color: theme.textPrimary }]}>{info.chairman_name}</Text>
                {info.chairman_message && (
                  <Text style={[styles.messageBody, { color: theme.textSecondary }]}>
                    "{info.chairman_message}"
                  </Text>
                )}
              </View>
            )}

            {info.deputy_chairman_name && (
              <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Deputy Chairman</Text>
                <Text style={[styles.personName, { color: theme.textPrimary }]}>{info.deputy_chairman_name}</Text>
                {info.deputy_chairman_message && (
                  <Text style={[styles.messageBody, { color: theme.textSecondary }]}>
                    "{info.deputy_chairman_message}"
                  </Text>
                )}
              </View>
            )}

            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>
                {info.secretary_designation ?? "Secretary"}
              </Text>
              <Text style={[styles.personName, { color: theme.textPrimary }]}>
                {info.secretary_name ?? "To be announced"}
              </Text>
              {info.secretary_message && (
                <Text style={[styles.messageBody, { color: theme.textSecondary }]}>
                  "{info.secretary_message}"
                </Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm, gap: spacing.xs },
  title: { fontSize: 24, fontWeight: "700" },
  content: { padding: spacing.lg },
  logo: { width: "100%", height: 90, marginBottom: spacing.lg },
  card: { borderWidth: 1, borderRadius: radii.md, padding: spacing.md, marginBottom: spacing.md },
  body: { fontSize: 15, lineHeight: 22 },
  sectionLabel: { fontSize: 12, fontWeight: "600", textTransform: "uppercase", marginBottom: spacing.xs },
  personName: { fontSize: 18, fontWeight: "700", marginBottom: spacing.xs },
  messageBody: { fontSize: 14, lineHeight: 20, fontStyle: "italic", marginTop: spacing.xs },
});
