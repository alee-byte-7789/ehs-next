import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Dimensions, Pressable as RNPressable, StyleSheet, View } from "react-native";
import { AppText as Text } from "./ui/AppText";

import { useAuth } from "../lib/auth-context";
import { useLocale } from "../lib/i18n/locale-context";
import { useResidentMe } from "../lib/resident-queries";
import { useAppTheme } from "../lib/theme/theme-context";

const DRAWER_WIDTH = Math.min(300, Dimensions.get("window").width * 0.82);

interface AppDrawerProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Custom slide-in drawer — no new navigation-library dependency needed,
 * just Animated (already part of react-native) driving a translateX on
 * an absolutely-positioned panel plus a dimmed backdrop. Consolidates
 * Profile/Settings/Language/Theme/About/Logout in one place per the
 * spec, out of the Home screen's card grid entirely.
 */
export function AppDrawer({ visible, onClose }: AppDrawerProps) {
  const { colors } = useAppTheme();
  const { t, locale, setLocale } = useLocale();
  const { mode, setMode } = useAppTheme();
  const { logout } = useAuth();
  const { data: resident } = useResidentMe(true);

  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: visible ? 0 : -DRAWER_WIDTH,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: visible ? 1 : 0,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, translateX, backdropOpacity]);

  const go = (path: string) => {
    onClose();
    router.push(path as never);
  };

  const handleLogout = async () => {
    onClose();
    await logout();
    router.replace("/login");
  };

  const cycleTheme = () => setMode(mode === "system" ? "light" : mode === "light" ? "dark" : "system");
  const themeLabel = mode === "system" ? "System" : mode === "light" ? "Light" : "Dark";
  const themeIcon = mode === "dark" ? "moon" : mode === "light" ? "sunny" : "phone-portrait-outline";

  return (
    <View
      pointerEvents={visible ? "auto" : "none"}
      style={StyleSheet.absoluteFill}
    >
      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.5)", opacity: backdropOpacity }]}
      >
        <RNPressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.panel,
          {
            width: DRAWER_WIDTH,
            backgroundColor: colors.surfaceElevated,
            transform: [{ translateX }],
          },
        ]}
      >
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.primaryTint }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {resident?.full_name?.[0]?.toUpperCase() ?? "R"}
            </Text>
          </View>
          <Text style={[styles.profileName, { color: colors.textPrimary }]} numberOfLines={1}>
            {resident?.full_name ?? "Resident"}
          </Text>
          <Text style={[styles.profileMeta, { color: colors.textTertiary }]} numberOfLines={1}>
            {resident?.resident_code ?? "Unverified"}
          </Text>
        </View>

        <View style={styles.itemsWrap}>
          <DrawerItem icon="person-outline" label="Profile" onPress={() => go("/profile")} />
          <DrawerItem icon="settings-outline" label="Settings" onPress={() => go("/settings")} />

          <DrawerItem
            icon="language-outline"
            label="Language"
            value={locale === "ur" ? "اردو" : "English"}
            onPress={() => setLocale(locale === "en" ? "ur" : "en")}
          />
          <DrawerItem icon={themeIcon as never} label="Theme" value={themeLabel} onPress={cycleTheme} />

          <DrawerItem icon="information-circle-outline" label="About" onPress={() => go("/about")} />
        </View>

        <View style={styles.footer}>
          <RNPressable
            onPress={handleLogout}
            style={[styles.logoutBtn, { backgroundColor: colors.dangerTint, borderRadius: colors.radii.md }]}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.danger} />
            <Text style={[styles.logoutText, { color: colors.danger }]}>{t("log_out")}</Text>
          </RNPressable>
        </View>
      </Animated.View>
    </View>
  );
}

function DrawerItem({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <RNPressable onPress={onPress} style={styles.item}>
      <Ionicons name={icon} size={20} color={colors.textSecondary} style={styles.itemIcon} />
      <Text style={[styles.itemLabel, { color: colors.textPrimary }]}>{label}</Text>
      {value ? <Text style={[styles.itemValue, { color: colors.textTertiary }]}>{value}</Text> : null}
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </RNPressable>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 4, height: 0 },
    elevation: 12,
  },
  profileHeader: { paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20, alignItems: "flex-start" },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  avatarText: { fontSize: 20, fontWeight: "700" },
  profileName: { fontSize: 16, fontWeight: "700" },
  profileMeta: { fontSize: 12, marginTop: 2 },
  itemsWrap: { paddingHorizontal: 8, gap: 2 },
  item: { flexDirection: "row", alignItems: "center", paddingVertical: 13, paddingHorizontal: 12, gap: 12 },
  itemIcon: { width: 22 },
  itemLabel: { flex: 1, fontSize: 15, fontWeight: "500" },
  itemValue: { fontSize: 12, fontWeight: "500", marginRight: 4 },
  footer: { marginTop: "auto", padding: 16 },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 },
  logoutText: { fontSize: 15, fontWeight: "700" },
});
