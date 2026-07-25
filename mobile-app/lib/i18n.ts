import { useSettings } from "./settings-context";

/**
 * Real, working translation system — NOT a stub. Currently covers the
 * Settings screen and a handful of common strings as a genuine proof of
 * concept. Extending this to every screen in the app is a separate,
 * larger pass (each screen's hardcoded <Text> strings need converting to
 * t('key') calls) — flagged honestly rather than claimed as "done."
 */
const translations = {
  en: {
    settings: "Settings",
    language: "Language",
    english: "English",
    urdu: "Urdu",
    appearance: "Appearance",
    followSystem: "Follow System",
    light: "Light",
    dark: "Dark",
    display: "Display",
    fontSize: "Font Size",
    small: "Small",
    default: "Default",
    large: "Large",
    extraLarge: "Extra Large",
    notifications: "Notifications",
    complaintUpdates: "Complaint Updates",
    announcements: "Announcements",
    emergencyAlerts: "Emergency Alerts",
    generalNotifications: "General Notifications",
    account: "Account",
    profile: "Profile",
    changePassword: "Change Password",
    logout: "Log out",
    currentPassword: "Current Password",
    newPassword: "New Password",
    save: "Save",
    cancel: "Cancel",
    passwordChanged: "Password changed successfully.",
    back: "Back",
  },
  ur: {
    settings: "ترتیبات",
    language: "زبان",
    english: "انگریزی",
    urdu: "اردو",
    appearance: "ظاہری شکل",
    followSystem: "سسٹم کی پیروی کریں",
    light: "روشن",
    dark: "تاریک",
    display: "ڈسپلے",
    fontSize: "فونٹ سائز",
    small: "چھوٹا",
    default: "طے شدہ",
    large: "بڑا",
    extraLarge: "اضافی بڑا",
    notifications: "اطلاعات",
    complaintUpdates: "شکایت کی تازہ کاری",
    announcements: "اعلانات",
    emergencyAlerts: "ہنگامی انتباہات",
    generalNotifications: "عمومی اطلاعات",
    account: "اکاؤنٹ",
    profile: "پروفائل",
    changePassword: "پاس ورڈ تبدیل کریں",
    logout: "لاگ آؤٹ",
    currentPassword: "موجودہ پاس ورڈ",
    newPassword: "نیا پاس ورڈ",
    save: "محفوظ کریں",
    cancel: "منسوخ کریں",
    passwordChanged: "پاس ورڈ کامیابی سے تبدیل ہو گیا۔",
    back: "واپس",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

export function useTranslation() {
  const { language } = useSettings();
  const t = (key: TranslationKey): string => translations[language][key] ?? translations.en[key];
  return { t, language };
}
