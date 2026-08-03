import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { AppText as Text } from "../../components/ui/AppText";
import { AppTextInput as TextInput } from "../../components/ui/AppTextInput";

import { AppButton } from "../../components/AppButton";
import { AppTextField } from "../../components/AppTextField";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Pressable } from "../../components/ui/Pressable";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { extractApiErrorMessage } from "../../lib/api-client";
import { useCreateComplaint } from "../../lib/complaint-queries";
import { SUBCATEGORY_OPTIONS } from "../../lib/complaint-subcategories";
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
  const [customSubcategory, setCustomSubcategory] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isOther = subcategory === "Other";
  const finalSubcategory = isOther ? customSubcategory.trim() : subcategory;

  const canSubmit = finalSubcategory.trim().length >= 2 && description.trim().length >= 5;

  const handleSelectCategory = (next: ComplaintCategory) => {
    setCategory(next);
    // The subcategory options are per-category, so a previously picked
    // chip (or "Other" text) from a different category is no longer valid.
    setSubcategory("");
    setCustomSubcategory("");
  };

  const handleSubmit = async () => {
    setError(null);
    try {
      const created = await createComplaint.mutateAsync({
        category,
        subcategory: finalSubcategory,
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
            <Pressable
              key={cat.key}
              onPress={() => handleSelectCategory(cat.key)}
              scaleTo={0.97}
              style={styles.categoryPress}
            >
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

      <Text style={[styles.label, { color: colors.textSecondary, marginBottom: 10 }]}>What's the issue?</Text>
      <View style={styles.chipWrap}>
        {SUBCATEGORY_OPTIONS[category].map((option) => {
          const active = subcategory === option;
          return (
            <Pressable key={option} onPress={() => setSubcategory(option)} scaleTo={0.95}>
              <View
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? colors.primary : colors.surfaceSunken,
                    borderColor: active ? colors.primary : colors.border,
                    borderRadius: colors.radii.pill,
                  },
                ]}
              >
                <Text style={[styles.chipLabel, { color: active ? colors.onPrimary : colors.textPrimary }]}>
                  {option}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {isOther && (
        <AppTextField
          label="Describe the issue (short title)"
          placeholder="e.g. Kitchen sink leaking"
          value={customSubcategory}
          onChangeText={setCustomSubcategory}
          maxLength={80}
        />
      )}

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
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  chip: { paddingVertical: 9, paddingHorizontal: 14, borderWidth: 1.5 },
  chipLabel: { fontSize: 13, fontWeight: "600" },
  descriptionField: { marginBottom: 20 },
  descriptionInput: { padding: 14, fontSize: 15, minHeight: 120, textAlignVertical: "top", borderWidth: 1 },
  error: { fontSize: 13, marginBottom: 12, textAlign: "center" },
});
