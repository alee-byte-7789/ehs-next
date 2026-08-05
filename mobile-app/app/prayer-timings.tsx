import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { AppText as Text } from "../components/ui/AppText";

import { ScreenContainer } from "../components/ScreenContainer";
import { AppButton } from "../components/AppButton";
import { AppTextField } from "../components/AppTextField";
import { Card, IconCircle } from "../components/ui/Card";
import { Pressable } from "../components/ui/Pressable";
import { GlassSegmentedControl } from "../components/ui/GlassSegmentedControl";
import { ScreenHeader } from "../components/ui/ScreenHeader";
import { useAdminAuth } from "../lib/admin-auth-context";
import { useUpdatePrayerTiming } from "../lib/admin-prayer-timing-mutations";
import { useLocale } from "../lib/i18n/locale-context";
import type { StringKey } from "../lib/i18n/strings";
import { usePrayerTimings } from "../lib/society-queries";
import { useAppTheme } from "../lib/theme/theme-context";
import type { MosqueName, PrayerTimingOut } from "../lib/types";

const MOSQUE_LABELS: Record<MosqueName, string> = {
  bilal_mosque: "Bilal Mosque",
  markazi_jamia_mosque: "Markazi Jamia Mosque",
};

type PrayerKey = "fajr" | "zuhr" | "asr" | "maghrib" | "isha";

const PRAYER_ORDER: { key: PrayerKey; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "fajr", icon: "partly-sunny" },
  { key: "zuhr", icon: "sunny" },
  { key: "asr", icon: "cloudy" },
  { key: "maghrib", icon: "moon" },
  { key: "isha", icon: "star" },
];

/** Parses a "4:52 AM" / "12:18 PM" style string into a Date on the given day. Returns null if unparsable. */
function parseTimeOn(day: Date, timeStr: string): Date | null {
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (period === "PM" && hours !== 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  const result = new Date(day);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

/** Given the device clock, finds which of today's prayers is next (wrapping to tomorrow's Fajr if all have passed). */
function findNextPrayer(timing: PrayerTimingOut, now: Date): { key: PrayerKey; at: Date } | null {
  const todayCandidates = PRAYER_ORDER.map(({ key }) => {
    const at = parseTimeOn(now, timing[key]);
    return at ? { key, at } : null;
  }).filter((c): c is { key: PrayerKey; at: Date } => c !== null && c.at > now);

  if (todayCandidates.length > 0) {
    return todayCandidates.reduce((soonest, c) => (c.at < soonest.at ? c : soonest));
  }

  // Everything today has passed — next up is tomorrow's Fajr.
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const fajrTomorrow = parseTimeOn(tomorrow, timing.fajr);
  return fajrTomorrow ? { key: "fajr", at: fajrTomorrow } : null;
}

function formatCountdown(target: Date, now: Date): string {
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return "now";
  const totalMinutes = Math.round(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `in ${minutes}m`;
  return `in ${hours}h ${minutes}m`;
}

export default function PrayerTimingsScreen() {
  const { colors } = useAppTheme();
  const { t } = useLocale();
  const { data: timings, isLoading } = usePrayerTimings();
  const { isAdminSignedIn, logout } = useAdminAuth();

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const [selectedMosque, setSelectedMosque] = useState<MosqueName | null>(null);
  const activeMosque = selectedMosque ?? timings?.[0]?.mosque_name ?? null;
  const activeTiming = timings?.find((tm) => tm.mosque_name === activeMosque) ?? timings?.[0];

  const nextPrayer = useMemo(
    () => (activeTiming ? findNextPrayer(activeTiming, now) : null),
    [activeTiming, now]
  );

  const today = now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

  return (
    <ScreenContainer>
      <ScreenHeader title={t("prayer_timings_title")} subtitle={today} />

      {isLoading && <Text style={{ color: colors.textSecondary }}>…</Text>}

      {timings && timings.length > 1 && activeMosque && (
        <View style={styles.mosqueSwitcher}>
          <GlassSegmentedControl
            options={timings.map((tm) => ({
              key: tm.mosque_name,
              label: MOSQUE_LABELS[tm.mosque_name],
              icon: "moon" as const,
            }))}
            value={activeMosque}
            onChange={setSelectedMosque}
            iconAbove={false}
          />
        </View>
      )}

      {activeTiming && nextPrayer && (
        <View style={[styles.nextCard, { backgroundColor: colors.primary, borderRadius: colors.radii.lg }]}>
          <Text style={styles.nextLabel}>{t("prayer_next_up").toUpperCase()}</Text>
          <Text style={styles.nextName}>{t(`prayer_${nextPrayer.key}` as StringKey)}</Text>
          <Text style={styles.nextTime}>
            {nextPrayer.at.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} ·{" "}
            {formatCountdown(nextPrayer.at, now)}
          </Text>
        </View>
      )}

      {timings?.map((timing) => (
        <MosqueCard
          key={timing.mosque_name}
          timing={timing}
          isAdmin={isAdminSignedIn}
          nextKey={timing.mosque_name === activeMosque ? nextPrayer?.key ?? null : null}
        />
      ))}

      <View style={styles.footer}>
        {isAdminSignedIn ? (
          <AppButton label={t("prayer_admin_logout")} variant="secondary" onPress={logout} />
        ) : (
          <Pressable onPress={() => router.push("/admin-login")}>
            <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: "center" }}>
              {t("prayer_admin_hint")}{" "}
              <Text style={{ color: colors.primary, fontWeight: "600" }}>{t("prayer_admin_login_link")}</Text>
            </Text>
          </Pressable>
        )}
      </View>
    </ScreenContainer>
  );
}

function MosqueCard({
  timing,
  isAdmin,
  nextKey,
}: {
  timing: PrayerTimingOut;
  isAdmin: boolean;
  nextKey: PrayerKey | null;
}) {
  const { colors } = useAppTheme();
  const { t } = useLocale();
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const updateTiming = useUpdatePrayerTiming();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValues({
      fajr: timing.fajr,
      zuhr: timing.zuhr,
      asr: timing.asr,
      maghrib: timing.maghrib,
      isha: timing.isha,
      jummah: timing.jummah ?? "",
    });
  }, [timing]);

  const handleSave = async () => {
    setError(null);
    try {
      await updateTiming.mutateAsync({
        mosqueName: timing.mosque_name,
        payload: {
          fajr: values.fajr,
          zuhr: values.zuhr,
          asr: values.asr,
          maghrib: values.maghrib,
          isha: values.isha,
          jummah: values.jummah || null,
        },
      });
      setEditing(false);
    } catch {
      setError(t("prayer_save_error"));
    }
  };

  return (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={[styles.mosqueName, { color: colors.textPrimary }]}>
          {MOSQUE_LABELS[timing.mosque_name]}
        </Text>
        {isAdmin && !editing && (
          <Pressable onPress={() => setEditing(true)}>
            <Text style={{ color: colors.primary, fontWeight: "600", fontSize: 13 }}>{t("prayer_edit")}</Text>
          </Pressable>
        )}
      </View>

      {!editing && (
        <View>
          {PRAYER_ORDER.map(({ key, icon }) => {
            const value = timing[key];
            const isNext = key === nextKey;
            return (
              <View
                key={key}
                style={[
                  styles.row,
                  isNext ? { backgroundColor: colors.primaryTint, borderRadius: colors.radii.md } : null,
                ]}
              >
                <View style={styles.rowLeft}>
                  <IconCircle backgroundColor={isNext ? colors.primary : colors.surfaceSunken} size={32}>
                    <Ionicons name={icon} size={15} color={isNext ? colors.onPrimary : colors.textSecondary} />
                  </IconCircle>
                  <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: isNext ? "700" : "500" }}>
                    {t(`prayer_${key}` as StringKey)}
                  </Text>
                  {key === "maghrib" && timing.maghrib_is_auto ? (
                    // Maghrib IS sunset, and sunset shifts ~1 min/day, so the
                    // value shown is computed daily rather than typed in by an
                    // admin. Labelled so it's clear it updates on its own.
                    <Text style={{ color: colors.textTertiary, fontSize: 11, marginLeft: 6 }}>
                      (sunset)
                    </Text>
                  ) : null}
                </View>
                <Text
                  style={{
                    color: isNext ? colors.primary : colors.textPrimary,
                    fontSize: 14,
                    fontWeight: "700",
                  }}
                >
                  {value}
                </Text>
              </View>
            );
          })}
          {timing.jummah && (
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <IconCircle backgroundColor={colors.surfaceSunken} size={32}>
                  <Ionicons name="people" size={15} color={colors.textSecondary} />
                </IconCircle>
                <Text style={{ color: colors.textPrimary, fontSize: 14 }}>{t("prayer_jummah")}</Text>
              </View>
              <Text style={{ color: colors.textPrimary, fontSize: 14, fontWeight: "700" }}>{timing.jummah}</Text>
            </View>
          )}
        </View>
      )}

      {editing && (
        <View>
          {[...PRAYER_ORDER.map((p) => p.key), "jummah" as const].map((key) => (
            <AppTextField
              key={key}
              label={t(`prayer_${key}` as StringKey)}
              value={values[key] ?? ""}
              onChangeText={(v) => setValues((prev) => ({ ...prev, [key]: v }))}
              placeholder="e.g. 5:30 AM"
            />
          ))}
          {error && <Text style={{ color: colors.danger, fontSize: 12, marginBottom: colors.spacing.sm }}>{error}</Text>}
          <View style={styles.editActions}>
            <AppButton label={t("save")} onPress={handleSave} loading={updateTiming.isPending} />
            <AppButton label={t("cancel")} variant="secondary" onPress={() => setEditing(false)} />
          </View>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  mosqueSwitcher: { marginBottom: 16 },
  nextCard: { padding: 20, marginBottom: 20, alignItems: "center" },
  nextLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  nextName: { color: "#FFFFFF", fontSize: 26, fontWeight: "700", marginTop: 4 },
  nextTime: { color: "#FFFFFF", fontSize: 15, fontWeight: "600", marginTop: 2 },
  card: { marginBottom: 16 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  mosqueName: { fontSize: 16, fontWeight: "700" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  editActions: { flexDirection: "row", gap: 8, marginTop: 8 },
  footer: { marginTop: 8 },
});
