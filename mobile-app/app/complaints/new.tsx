import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import { AppButton } from "../../components/AppButton";
import { AppTextField } from "../../components/AppTextField";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Pressable } from "../../components/ui/Pressable";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { extractApiErrorMessage } from "../../lib/api-client";
import { useCreateComplaint } from "../../lib/complaint-queries";
import { useAppTheme } from "../../lib/theme/theme-context";
import type { ComplaintCategory } from "../../lib/types";

const CATEGORIES: { key: ComplaintCategory; label: string; description: string }[] = [
  { key: "infrastructure", label: "Infrastructure", description: "Plumbing, electrical, structural issues" },
  { key: "general", label: "General", description: "Anything else about the house or society" },
  { key: "internal", label: "Internal", description: "Staff conduct or internal process issues" },
];

export default function NewComplaintScreen() {
  const { colors } = useAppTheme();
  const createComplaint = useCreateComplaint();

  const [category, setCategory] = useState<ComplaintCategory>("infrastructure");
  const [subcategory, setSubcategory] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canSubmit = subcategory.trim().length >= 2 && description.trim().length >= 5;

  const handleSubmit = async () => {
    setError(null);
    try {
      const created = await createComplaint.mutateAsync({
        category,
        subcategory: subcategory.trim(),
        description: description.trim(),
      });
      router.replace(`/complaints/${created.id}`);
    } catch (err) {
      setError(extractApiErrorMessage(err, "Couldn't submit your complaint. Please try again."));
    }
  };

  return (
    <ScreenContainer>
      <ScreenHeader title="Register Complaint" subtitle="Tell us what's wrong — we'll route it to the right team" />

      <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
      <View style={styles.categoryRow}>
        {CATEGORIES.map((cat) => {
          const active = category === cat.key;
          return (
            <Pressable key={cat.key} onPress={() => setCategory(cat.key)} scaleTo={0.97} style={styles.categoryPress}>
              <View
                style={[
                  styles.categoryCard,
                  {
                    backgroundColor: active ? colors.primaryTint : colors.surfaceSunken,
                    borderColor: active ? colors.primary : colors.border,
                    borderRadius: colors.radii.md,
                  },
                ]}
              >
                <Text style={[styles.categoryLabel, { color: active ? colors.primary : colors.textPrimary }]}>
                  {cat.label}
                </Text>
                <Text style={[styles.categoryDesc, { color: active ? colors.primary : colors.textSecondary }]} numberOfLines={2}>
                  {cat.description}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <AppTextField
        label="What's the issue? (short title)"
        placeholder="e.g. Kitchen sink leaking"
        value={subcategory}
        onChangeText={setSubcategory}
        maxLength={80}
      />

      <View style={styles.descriptionField}>
        <Text style={[styles.label, { color: colors.textSecondary, marginBottom: 6 }]}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the issue in detail — location, when it started, anything the team should know."
          placeholderTextColor={colors.textTertiary}
          multiline
          maxLength={2000}
          style={[
            styles.descriptionInput,
            {
              color: colors.textPrimary,
              backgroundColor: colors.surfaceSunken,
              borderRadius: colors.radii.md,
              borderColor: colors.border,
            },
          ]}
        />
      </View>

      {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}

      <AppButton
        label="Submit Complaint"
        onPress={handleSubmit}
        loading={createComplaint.isPending}
        disabled={!canSubmit}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: "600" },
  categoryRow: { gap: 10, marginTop: 8, marginBottom: 20 },
  categoryPress: { width: "100%" },
  categoryCard: { padding: 14, borderWidth: 1.5, gap: 3 },
  categoryLabel: { fontSize: 15, fontWeight: "700" },
  categoryDesc: { fontSize: 12 },
  descriptionField: { marginBottom: 20 },
  descriptionInput: { padding: 14, fontSize: 15, minHeight: 120, textAlignVertical: "top", borderWidth: 1 },
  error: { fontSize: 13, marginBottom: 12, textAlign: "center" },
});
