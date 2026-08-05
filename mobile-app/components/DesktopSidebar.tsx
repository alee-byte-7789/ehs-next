import { Ionicons } from "@expo/vector-icons";
import { usePathname } from "expo-router";
import { useRef } from "react";
import { Animated, Image, Platform, Pressable, StyleSheet, View } from "react-native";

import { useNavItems, type NavItem } from "../lib/nav-items";
import { useResidentMe } from "../lib/resident-queries";
import { useAppTheme } from "../lib/theme/theme-context";
import { AppText as Text } from "./ui/AppText";

export const SIDEBAR_WIDTH = 260;

/**
 * Permanent, always-expanded navigation for desktop-width screens.
 *
 * On a phone the same destinations live behind the hamburger (AppDrawer).
 * On a wide screen hiding them behind a menu button wastes the space and
 * makes the app feel like a phone app stretched into a browser window,
 * which is exactly the complaint this addresses. Both render from
 * useNavItems, so they cannot drift apart.
 */
export function DesktopSidebar() {
  const { colors } = useAppTheme();
  const { data: resident } = useResidentMe(true);
  const { items, logout } = useNavItems();
  const pathname = usePathname();

  return (
    <View
      style={[
        styles.sidebar,
        { backgroundColor: colors.surfaceElevated, borderRightColor: colors.border },
      ]}
    >
      <View style={styles.brandRow}>
        <Image source={require("../assets/icon.png")} style={styles.brandIcon} resizeMode="contain" />
        <Text style={[styles.brandName, { color: colors.textPrimary }]}>EHS Next</Text>
      </View>

      <View style={[styles.profileCard, { backgroundColor: colors.primaryTint, borderRadius: colors.radii.md }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={[styles.avatarText, { color: colors.onPrimary }]}>
            {resident?.full_name?.[0]?.toUpperCase() ?? "R"}
          </Text>
        </View>
        <View style={styles.profileText}>
          <Text style={[styles.profileName, { color: colors.textPrimary }]} numberOfLines={1}>
            {resident?.full_name ?? "Resident"}
          </Text>
          <Text style={[styles.profileMeta, { color: colors.textSecondary }]} numberOfLines={1}>
            {resident?.house_code ?? "—"}
          </Text>
        </View>
      </View>

      <View style={styles.items}>
        {items.map((item) => (
          <SidebarItem key={item.key} item={item} active={isActive(pathname, item.key)} />
        ))}
      </View>

      <View style={styles.footer}>
        <SidebarItem
          item={{ key: "logout", icon: "log-out", label: "Log out", onPress: logout }}
          active={false}
          danger
        />
        <Text style={[styles.copyright, { color: colors.textTertiary }]}>
          Copyright reserved by{"\n"}Null Point Errors Co. Ltd.{"\n"}Estd 2026
        </Text>
      </View>
    </View>
  );
}

function isActive(pathname: string, key: string): boolean {
  if (key === "home") return pathname === "/home";
  if (key === "complaints") return pathname.startsWith("/complaints");
  return pathname === `/${key}` || pathname.startsWith(`/${key}`);
}

function SidebarItem({ item, active, danger }: { item: NavItem; active: boolean; danger?: boolean }) {
  const { colors } = useAppTheme();

  // Hover is a desktop-only affordance; on touch there is no hover state to
  // animate, so this stays flat there rather than firing on press.
  const hover = useRef(new Animated.Value(0)).current;
  const animateHover = (to: number) =>
    Animated.timing(hover, { toValue: to, duration: 160, useNativeDriver: false }).start();

  const tint = danger ? colors.danger : colors.primary;

  const backgroundColor = active
    ? colors.primaryTint
    : hover.interpolate({
        inputRange: [0, 1],
        outputRange: ["rgba(0,0,0,0)", colors.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"],
      });

  // Subtle glow on hover — a coloured shadow that fades in, rather than a
  // hard border appearing, so the row lifts instead of flickering.
  const shadowOpacity = hover.interpolate({ inputRange: [0, 1], outputRange: [0, 0.35] });

  return (
    <Pressable
      onPress={item.onPress}
      onHoverIn={Platform.OS === "web" ? () => animateHover(1) : undefined}
      onHoverOut={Platform.OS === "web" ? () => animateHover(0) : undefined}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Animated.View
        style={[
          styles.item,
          {
            backgroundColor,
            borderRadius: colors.radii.button,
            shadowColor: tint,
            shadowOpacity,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 0 },
          },
        ]}
      >
        <Ionicons
          name={item.icon}
          size={18}
          color={active || danger ? tint : colors.textSecondary}
        />
        <Text
          style={[
            styles.itemLabel,
            {
              color: active || danger ? tint : colors.textPrimary,
              fontWeight: active ? "700" : "500",
            },
          ]}
          numberOfLines={1}
        >
          {item.label}
        </Text>
        {item.value ? (
          <Text style={[styles.itemValue, { color: colors.textTertiary }]}>{item.value}</Text>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: SIDEBAR_WIDTH,
    borderRightWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingTop: 24,
    paddingBottom: 16,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 8, marginBottom: 20 },
  brandIcon: { width: 30, height: 30, borderRadius: 6 },
  brandName: { fontSize: 17, fontWeight: "800" },
  profileCard: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, marginBottom: 18 },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 16, fontWeight: "700" },
  profileText: { flex: 1 },
  profileName: { fontSize: 14, fontWeight: "700" },
  profileMeta: { fontSize: 12 },
  items: { gap: 2 },
  item: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11, paddingHorizontal: 12 },
  itemLabel: { flex: 1, fontSize: 14 },
  itemValue: { fontSize: 12, fontWeight: "500" },
  footer: { marginTop: "auto", gap: 12 },
  copyright: { fontSize: 10, lineHeight: 14, textAlign: "center" },
});
