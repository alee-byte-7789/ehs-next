import { Pressable, StyleSheet, Text, View } from "react-native";

import { useTheme } from "../lib/use-theme";

export function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable key={star} onPress={() => onChange(star)} hitSlop={8}>
          <Text style={[styles.star, { color: star <= value ? "#F59E0B" : theme.border }]}>★</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 4 },
  star: { fontSize: 32 },
});
