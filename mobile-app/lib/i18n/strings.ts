export type Locale = "en" | "ur";

export const LOCALE_LABEL: Record<Locale, string> = {
  en: "English",
  ur: "اردو",
};

/**
 * Flat key → string dictionaries. Keep keys identical across locales;
 * TypeScript will error (via the `satisfies` check in theme-context) if
 * `ur` drifts from the `en` key set.
 */
export const STRINGS = {
  en: {
    // Greetings / Home
    good_morning: "Good morning",
    good_afternoon: "Good afternoon",
    good_evening: "Good evening",
    quick_actions: "Quick actions",
    recent_activity: "Recent activity",
    see_all: "See all",
    log_out: "Log out",
    no_complaints_home: 'No complaints yet. Tap "Register Complaint" above to file one.',

    // Quick action labels
    action_register_complaint: "Register Complaint",
    action_register_complaint_desc: "Report an issue",
    action_my_complaints: "My Complaints",
    action_my_complaints_desc: "Track & manage",
    action_emergency: "Emergency",
    action_emergency_desc: "One-tap dial",
    action_prayer_timings: "Prayer Timings",
    action_prayer_timings_desc: "Today's schedule",
    action_notifications: "Notifications",
    action_notifications_desc: "Updates & alerts",
    action_profile: "Profile",
    action_profile_desc: "Your details",
    action_settings: "Settings",
    action_settings_desc: "Theme & app",

    // Summary tiles
    summary_open: "Open",
    summary_resolved: "Resolved",
    summary_total: "Total",

    // Settings screen
    settings_title: "Settings",
    settings_subtitle: "Personalize how EHS Next looks and feels",
    settings_appearance: "Appearance",
    settings_follow_system: "Follow System",
    settings_light: "Light",
    settings_dark: "Dark",
    settings_theme_color: "Theme Color",
    settings_display: "Display",
    settings_display_small: "Small",
    settings_display_default: "Default",
    settings_display_large: "Large",
    settings_display_xlarge: "Extra Large",
    settings_glass_effect: "Glass Effect",
    settings_glass_effect_desc: "Frosted, translucent cards and surfaces",
    settings_general: "General",
    settings_language: "Language",
    settings_notifications: "Notifications",
    settings_privacy: "Privacy",
    settings_about: "About EHS Next",
    settings_choose_language: "Choose Language",

    // Login
    login_welcome_back: "Welcome back",
    login_subtitle: "Log in to EHS Next with your phone or email.",
    login_identifier_label: "Phone or email",
    login_password_label: "Password",
    login_button: "Log in",
    login_register_link: "New here? Register your house",

    // Complaints
    complaints_title: "My Complaints",
    complaints_search: "Search complaints",
    complaints_filter_all: "All",
    complaints_filter_open: "Open",
    complaints_filter_resolved: "Resolved",
    complaints_newest: "Newest",
    complaints_oldest: "Oldest",
    complaints_empty_title: "No complaints yet",
    complaints_empty_body: "Complaints you register will show up here.",

    // Profile
    profile_title: "Profile",
    profile_phone: "Phone",
    profile_email: "Email",
    profile_verification: "Verification",
    profile_employee: "Employee",

    // Prayer timings
    prayer_timings_title: "Prayer Timings",
    prayer_next_up: "Next up",
    prayer_fajr: "Fajr",
    prayer_zuhr: "Zuhr",
    prayer_asr: "Asr",
    prayer_maghrib: "Maghrib",
    prayer_isha: "Isha",
    prayer_jummah: "Jummah",
    prayer_edit: "Edit",
    prayer_admin_hint: "Housing Office Admin?",
    prayer_admin_login_link: "Log in to edit",
    prayer_admin_logout: "Log out (admin)",
    prayer_save_error: "Could not save. Check your admin session hasn't expired.",

    // Admin login
    admin_login_title: "Admin Login",
    admin_login_subtitle:
      "For Housing Office admins only — used to edit prayer timings directly from the app instead of the Admin Portal website.",
    admin_login_email: "Email",
    admin_login_password: "Password",
    admin_login_button: "Log in as Admin",
    admin_login_error: "Invalid admin credentials.",

    // Common
    retry: "Retry",
    cancel: "Cancel",
    save: "Save",
  },
  ur: {
    good_morning: "صبح بخیر",
    good_afternoon: "دن بخیر",
    good_evening: "شام بخیر",
    quick_actions: "فوری اقدامات",
    recent_activity: "حالیہ سرگرمی",
    see_all: "سب دیکھیں",
    log_out: "لاگ آؤٹ",
    no_complaints_home: "ابھی کوئی شکایت نہیں۔ درج کرنے کے لیے اوپر \"شکایت درج کریں\" دبائیں۔",

    action_register_complaint: "شکایت درج کریں",
    action_register_complaint_desc: "مسئلہ رپورٹ کریں",
    action_my_complaints: "میری شکایات",
    action_my_complaints_desc: "ٹریک اور انتظام کریں",
    action_emergency: "ہنگامی صورتحال",
    action_emergency_desc: "ایک ٹیپ ڈائل",
    action_prayer_timings: "نماز کے اوقات",
    action_prayer_timings_desc: "آج کا شیڈول",
    action_notifications: "اطلاعات",
    action_notifications_desc: "اپ ڈیٹس اور الرٹس",
    action_profile: "پروفائل",
    action_profile_desc: "آپ کی تفصیلات",
    action_settings: "ترتیبات",
    action_settings_desc: "تھیم اور ایپ",

    summary_open: "کھلی",
    summary_resolved: "حل شدہ",
    summary_total: "کل",

    settings_title: "ترتیبات",
    settings_subtitle: "اپنی مرضی کے مطابق ای ایچ ایس نیکسٹ کی شکل و صورت بنائیں",
    settings_appearance: "ظاہری شکل",
    settings_follow_system: "سسٹم کی پیروی کریں",
    settings_light: "لائٹ",
    settings_dark: "ڈارک",
    settings_theme_color: "تھیم کا رنگ",
    settings_display: "ڈسپلے",
    settings_display_small: "چھوٹا",
    settings_display_default: "ڈیفالٹ",
    settings_display_large: "بڑا",
    settings_display_xlarge: "بہت بڑا",
    settings_glass_effect: "گلاس ایفیکٹ",
    settings_glass_effect_desc: "دھندلے، شفاف کارڈز اور سطحیں",
    settings_general: "عمومی",
    settings_language: "زبان",
    settings_notifications: "اطلاعات",
    settings_privacy: "رازداری",
    settings_about: "ای ایچ ایس نیکسٹ کے بارے میں",
    settings_choose_language: "زبان منتخب کریں",

    login_welcome_back: "خوش آمدید",
    login_subtitle: "اپنے فون یا ای میل کے ساتھ ای ایچ ایس نیکسٹ میں لاگ ان کریں۔",
    login_identifier_label: "فون یا ای میل",
    login_password_label: "پاس ورڈ",
    login_button: "لاگ ان کریں",
    login_register_link: "نئے ہیں؟ اپنا گھر رجسٹر کریں",

    complaints_title: "میری شکایات",
    complaints_search: "شکایات تلاش کریں",
    complaints_filter_all: "تمام",
    complaints_filter_open: "کھلی",
    complaints_filter_resolved: "حل شدہ",
    complaints_newest: "تازہ ترین",
    complaints_oldest: "پرانی ترین",
    complaints_empty_title: "ابھی کوئی شکایت نہیں",
    complaints_empty_body: "آپ کی درج کردہ شکایات یہاں ظاہر ہوں گی۔",

    profile_title: "پروفائل",
    profile_phone: "فون",
    profile_email: "ای میل",
    profile_verification: "تصدیق",
    profile_employee: "ملازم",

    prayer_timings_title: "نماز کے اوقات",
    prayer_next_up: "اگلی نماز",
    prayer_fajr: "فجر",
    prayer_zuhr: "ظہر",
    prayer_asr: "عصر",
    prayer_maghrib: "مغرب",
    prayer_isha: "عشاء",
    prayer_jummah: "جمعہ",
    prayer_edit: "ترمیم",
    prayer_admin_hint: "ہاؤسنگ آفس ایڈمن؟",
    prayer_admin_login_link: "ترمیم کے لیے لاگ ان کریں",
    prayer_admin_logout: "لاگ آؤٹ (ایڈمن)",
    prayer_save_error: "محفوظ نہیں ہو سکا۔ چیک کریں کہ آپ کا ایڈمن سیشن ختم تو نہیں ہوا۔",

    admin_login_title: "ایڈمن لاگ ان",
    admin_login_subtitle:
      "صرف ہاؤسنگ آفس ایڈمنز کے لیے — نماز کے اوقات کو ایڈمن پورٹل ویب سائٹ کی بجائے براہ راست ایپ سے ترمیم کرنے کے لیے استعمال ہوتا ہے۔",
    admin_login_email: "ای میل",
    admin_login_password: "پاس ورڈ",
    admin_login_button: "بطور ایڈمن لاگ ان کریں",
    admin_login_error: "غلط ایڈمن معلومات۔",

    retry: "دوبارہ کوشش کریں",
    cancel: "منسوخ کریں",
    save: "محفوظ کریں",
  },
} satisfies Record<Locale, Record<string, string>>;

export type StringKey = keyof typeof STRINGS.en;
