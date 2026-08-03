import { Ionicons } from "@expo/vector-icons";
import { StyleSheet } from "react-native";

import { Pressable } from "./ui/Pressable";
import { useAppTheme } from "../lib/theme/theme-context";

interface FabProps {
  onPress: () => void;
}

/**
 * Fixed bottom-right FAB for Register Complaint — the spec's preferred
 * solution over a card in the grid, since a card competes for attention
 * with everything else on Home and its label can get visually crowded.
 * A FAB is unambiguous, always in the same reachable spot, and matches
 * the "primary action" convention users already know from other apps.
 */
export function RegisterComplaintFab({ onPress }: FabProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      scaleTo={0.92}
      style={[
        styles.fab,
        {
          backgroundColor: colors.primary,
          shadowColor: colors.primary,
        },
      ]}
      accessibilityLabel="Register a complaint"
      accessibilityRole="button"
    >
      <Ionicons name="add" size={30} color={colors.onPrimary ?? "#FFFFFF"} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    bottom: 28,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
});
