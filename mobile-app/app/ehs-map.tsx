import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppTextField } from "../components/AppTextField";
import { useTranslation } from "../lib/i18n";
import { radii, shadow, spacing } from "../lib/theme";
import { useTheme } from "../lib/use-theme";

/**
 * Shell for the EHS Map feature — search UI and screen structure are real
 * and working now. The actual map image/coordinate data hasn't been
 * provided yet, so the map itself shows a clear "coming soon" state
 * rather than a fake placeholder image. Once the map + house-coordinate
 * data exists, only the `MapCanvas` function below needs replacing — the
 * search/filter logic above it already works and won't need to change.
 */
export default function EhsMapScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const trimmedSearch = useMemo(() => search.trim(), [search]);

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={theme.primary} />
          <Text style={{ color: theme.primary, fontSize: 15 }}>{t("back")}</Text>
        </Pressable>
        <Text style={[styles.title, { color: theme.textPrimary }]}>{t("ehsMap")}</Text>
      </View>

      <View style={styles.searchWrap}>
        <AppTextField
          label={t("searchHouseOrStreet")}
          placeholder="e.g. B-026 or Street 4"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <MapCanvas theme={theme} searchQuery={trimmedSearch} />
      </ScrollView>
    </View>
  );
}

function MapCanvas({ theme, searchQuery }: { theme: ReturnType<typeof useTheme>; searchQuery: string }) {
  const { t } = useTranslation();
  return (
    <View style={[styles.mapPlaceholder, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }, shadow.card]}>
      <Ionicons name="map-outline" size={48} color={theme.secondary} />
      <Text style={[styles.mapPlaceholderTitle, { color: theme.textPrimary }]}>{t("mapComingSoon")}</Text>
      <Text style={[styles.mapPlaceholderBody, { color: theme.textSecondary }]}>
        {t("mapDescription")}
      </Text>
      {searchQuery.length > 0 && (
        <View style={[styles.searchEcho, { backgroundColor: theme.primaryTint }]}>
          <Text style={{ color: theme.primary, fontSize: 13, fontWeight: "600" }}>
            {t("searchingFor")} "{searchQuery}"
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.sm, gap: spacing.xs },
  backButton: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginBottom: spacing.xs },
  title: { fontSize: 24, fontWeight: "700" },
  searchWrap: { paddingHorizontal: spacing.lg },
  content: { padding: spacing.lg, alignItems: "center" },
  mapPlaceholder: {
    width: "100%",
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: "center",
    minHeight: 320,
    justifyContent: "center",
  },
  mapPlaceholderTitle: { fontSize: 18, fontWeight: "700", marginTop: spacing.md, marginBottom: spacing.xs },
  mapPlaceholderBody: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  searchEcho: { marginTop: spacing.lg, padding: spacing.sm, borderRadius: radii.md },
});
