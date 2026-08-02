import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { AppButton } from "../../components/AppButton";
import { AppTextField } from "../../components/AppTextField";
import { ScreenContainer } from "../../components/ScreenContainer";
import { Pressable } from "../../components/ui/Pressable";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { COMPLAINT_CATEGORIES, type ComplaintCategory, type Priority } from "../../lib/mock-data";
import { useAppTheme } from "../../lib/theme/theme-context";

const PRIORITIES: { key: Priority; label: string }[] = [
  { key: "low", label: "Low" },
  { key: "medium", label: "Medium" },
  { key: "high", label: "High" },
];

export default function NewComplaintScreen() {
  const { colors } = useAppTheme();
  const [category, setCategory] = useState<ComplaintCategory | null>(null);
  const [priority, setPriority] = useState<Priority>("medium");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [titleError, setTitleError] = useState<string | undefined>();
  const [categoryError, setCategoryError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    let hasError = false;

    if (!category) {
      setCategoryError("Pick a category for your complaint");
      hasError = true;
    } else {
      setCategoryError(undefined);
    }

    if (trimmedTitle.length < 6) {
      setTitleError("Give it a short, clear title (at least 6 characters)");
      hasError = true;
    } else {
      setTitleError(undefined);
    }

    if (hasError) return;

    setSubmitting(true);
    // NOTE: complaints aren't wired to a real backend endpoint yet — this
    // mirrors the eventual POST /complaints call once the API is ready.
    await new Promise((resolve) => setTimeout(resolve, 500));
    setSubmitting(false);

    Alert.alert("Complaint submitted", "We've logged your complaint and will keep you updated on its status.", [
      { text: "OK", onPress: () => router.replace("/complaints") },
    ]);
  };

  return (
    <ScreenContainer>
      <ScreenHeader title="Register Complaint" subtitle="Tell us what's going on" />

      <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
      <View style={styles.categoryGrid}>
        {COMPLAINT_CATEGORIES.map((c) => {
          const active = category === c;
          return (
            <Pressable
              key={c}
              onPress={() => {
                setCategory(c);
                setCategoryError(undefined);
              }}
              scaleTo={0.95}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: active ? colors.primaryTint : colors.surfaceElevated,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={[styles.categoryLabel, { color: active ? colors.primary : colors.textSecondary }]}>
                {c}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {categoryError ? <Text style={[styles.errorText, { color: colors.danger }]}>{categoryError}</Text> : null}

      <AppTextField
        label="Title"
        placeholder="e.g. Kitchen sink leaking under the cabinet"
        value={title}
        onChangeText={setTitle}
        error={titleError}
      />

      <AppTextField
        label="Description (optional)"
        placeholder="Add any details that will help the department resolve this faster"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
        style={styles.textArea}
      />

      <Text style={[styles.label, { color: colors.textSecondary }]}>Priority</Text>
      <View style={styles.priorityRow}>
        {PRIORITIES.map((p) => {
          const active = priority === p.key;
          return (
            <Pressable
              key={p.key}
              onPress={() => setPriority(p.key)}
              scaleTo={0.96}
              style={[
                styles.priorityPill,
                {
                  backgroundColor: active ? colors.primaryTint : colors.surfaceElevated,
                  borderColor: active ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={[styles.priorityLabel, { color: active ? colors.primary : colors.textSecondary }]}>
                {p.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.submitWrap}>
        <AppButton
          label="Submit Complaint"
          onPress={handleSubmit}
          loading={submitting}
          icon={<Ionicons name="send" size={16} color={colors.onPrimary} />}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: "600", marginBottom: 8 },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 6 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1 },
  categoryLabel: { fontSize: 13, fontWeight: "600" },
  errorText: { fontSize: 12, marginBottom: 14, marginTop: 2 },
  textArea: { minHeight: 96, textAlignVertical: "top", paddingTop: 14 },
  priorityRow: { flexDirection: "row", gap: 8, marginBottom: 24 },
  priorityPill: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  priorityLabel: { fontSize: 13, fontWeight: "600" },
  submitWrap: { marginBottom: 12 },
});
