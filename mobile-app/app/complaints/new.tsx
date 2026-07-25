import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { z } from "zod";

import { AppButton } from "../../components/AppButton";
import { AppTextField } from "../../components/AppTextField";
import { ScreenContainer } from "../../components/ScreenContainer";
import { extractApiErrorMessage } from "../../lib/api-client";
import { SUBCATEGORY_OPTIONS } from "../../lib/complaint-subcategories";
import { useCreateComplaint } from "../../lib/complaint-queries";
import { radii, spacing } from "../../lib/theme";
import { useTheme } from "../../lib/use-theme";
import type { ComplaintCategory } from "../../lib/types";

const CATEGORY_OPTIONS: { value: ComplaintCategory; label: string }[] = [
  { value: "general", label: "General" },
  { value: "infrastructure", label: "Infrastructure" },
  { value: "internal", label: "Internal / Society" },
];

const schema = z
  .object({
    category: z.enum(["general", "infrastructure", "internal"]),
    subcategory: z.string().min(1, "Choose an issue type"),
    customSubcategory: z.string().optional(),
    description: z.string().min(5, "Tell us a bit more about the issue"),
  })
  .superRefine((values, ctx) => {
    if (values.subcategory === "Other" && !values.customSubcategory?.trim()) {
      ctx.addIssue({ code: "custom", path: ["customSubcategory"], message: "Enter a short title for the issue" });
    }
  });

type FormValues = z.infer<typeof schema>;

export default function NewComplaintScreen() {
  const theme = useTheme();
  const createComplaint = useCreateComplaint();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { category: "general", subcategory: "", customSubcategory: "", description: "" },
  });

  const category = watch("category");
  const subcategory = watch("subcategory");

  // Reset the chosen subcategory whenever the category changes, since the
  // available options are different per category.
  useEffect(() => {
    setValue("subcategory", "");
    setValue("customSubcategory", "");
  }, [category, setValue]);

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    const finalSubcategory = values.subcategory === "Other" ? values.customSubcategory!.trim() : values.subcategory;
    try {
      const created = await createComplaint.mutateAsync({
        category: values.category,
        subcategory: finalSubcategory,
        description: values.description,
      });
      router.replace(`/complaints/${created.id}`);
    } catch (err) {
      setServerError(extractApiErrorMessage(err, "Could not submit your complaint. Please try again."));
    }
  };

  return (
    <ScreenContainer>
      <Text style={[styles.title, { color: theme.textPrimary }]}>Raise a Complaint</Text>

      <Text style={[styles.label, { color: theme.textSecondary }]}>Category</Text>
      <View style={styles.chipRow}>
        {CATEGORY_OPTIONS.map((opt) => (
          <Controller
            key={opt.value}
            control={control}
            name="category"
            render={({ field }) => (
              <Pressable
                onPress={() => field.onChange(opt.value)}
                style={[
                  styles.chip,
                  {
                    borderColor: category === opt.value ? theme.primary : theme.border,
                    backgroundColor: category === opt.value ? theme.primary : "transparent",
                  },
                ]}
              >
                <Text style={{ color: category === opt.value ? "#FFFFFF" : theme.textPrimary, fontWeight: "600", fontSize: 13 }}>
                  {opt.label}
                </Text>
              </Pressable>
            )}
          />
        ))}
      </View>

      <Text style={[styles.label, { color: theme.textSecondary }]}>What's the issue?</Text>
      <Controller
        control={control}
        name="subcategory"
        render={({ field }) => (
          <View style={styles.wrapChipRow}>
            {SUBCATEGORY_OPTIONS[category].map((opt) => (
              <Pressable
                key={opt}
                onPress={() => field.onChange(opt)}
                style={[
                  styles.wrapChip,
                  {
                    borderColor: field.value === opt ? theme.primary : theme.border,
                    backgroundColor: field.value === opt ? theme.primary : theme.surface,
                  },
                ]}
              >
                <Text style={{ color: field.value === opt ? "#FFFFFF" : theme.textPrimary, fontWeight: "600", fontSize: 13 }}>
                  {opt}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      />
      {errors.subcategory && <Text style={{ color: theme.danger, fontSize: 12, marginTop: -spacing.sm, marginBottom: spacing.md }}>{errors.subcategory.message}</Text>}

      {subcategory === "Other" && (
        <Controller
          control={control}
          name="customSubcategory"
          render={({ field }) => (
            <AppTextField
              label="Describe the issue type"
              placeholder="e.g. Elevator Malfunction"
              value={field.value}
              onChangeText={field.onChange}
              error={errors.customSubcategory?.message}
            />
          )}
        />
      )}

      <Controller
        control={control}
        name="description"
        render={({ field }) => (
          <AppTextField
            label="Description"
            placeholder="Describe the issue in a bit more detail..."
            multiline
            numberOfLines={5}
            style={{ minHeight: 110, textAlignVertical: "top" }}
            value={field.value}
            onChangeText={field.onChange}
            error={errors.description?.message}
          />
        )}
      />

      {serverError && <Text style={{ color: theme.danger, marginBottom: spacing.md, textAlign: "center" }}>{serverError}</Text>}

      <AppButton label="Submit Complaint" onPress={handleSubmit(onSubmit)} loading={createComplaint.isPending} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 24, fontWeight: "700", marginBottom: spacing.lg },
  label: { fontSize: 13, fontWeight: "500", marginBottom: spacing.sm },
  chipRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    borderWidth: 1.5,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    flex: 1,
    alignItems: "center",
  },
  wrapChipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  wrapChip: {
    borderWidth: 1.5,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
});
