import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { AppText as Text } from "./AppText";

import { useAppTheme } from "../../lib/theme/theme-context";
import { Card } from "./Card";
import { Pressable } from "./Pressable";

interface QuickActionCardProps {
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap | keyof typeof MaterialCommunityIcons.glyphMap;
  /** Ionicons doesn't have a real mosque icon — MaterialCommunityIcons
   * does ("mosque-outline"), so this lets a card opt into that icon set
   * instead. Defaults to Ionicons so every existing card is unaffected. */
  iconFamily?: "ionicons" | "material-community";
  onPress: () => void;
  badge?: number;
}

export function QuickActionCard({ label, description, icon, iconFamily = "ionicons", onPress, badge }: QuickActionCardProps) {
  const { colors } = useAppTheme();
  const IconComponent = iconFamily === "material-community" ? MaterialCommunityIcons : Ionicons;

  return (
    <Pressable onPress={onPress} style={styles.pressWrap} scaleTo={0.96}>
      <Card padding={colors.spacing.md} style={styles.card}>
        <View
          style={[
            styles.iconWrap,
            // Circular, not a rounded square. The 4px surface radius makes
            // small square accents read as hard chips; a circle keeps the
            // "glass icon accent" look the design is built around.
            { backgroundColor: colors.primaryTint, borderRadius: 999 },
          ]}
        >
          <IconComponent name={icon as never} size={22} color={colors.primary} />
          {badge ? (
            <View style={[styles.badge, { backgroundColor: colors.danger, borderColor: colors.surfaceElevated }]}>
              <Text style={styles.badgeText}>{badge > 9 ? "9+" : badge}</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.label, { color: colors.textPrimary }]} numberOfLines={1}>
          {label}
        </Text>
        <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
          {description}
        </Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressWrap: {
    width: "47%",
  },
  card: {
    minHeight: 128,
    justifyContent: "space-between",
    gap: 10,
  },
  iconWrap: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
  },
});
