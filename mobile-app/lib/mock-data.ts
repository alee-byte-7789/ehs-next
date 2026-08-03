/**
 * Placeholder data for screens whose backend has NO endpoint at all yet
 * (notifications, maintenance service directory, emergency contacts, prayer
 * timings). Complaints are NOT here anymore — see `lib/complaint-queries.ts`,
 * which calls the real `/complaints/mine` API against your Supabase-backed
 * database, matching backend/app/api/v1/complaints.py exactly.
 *
 * The remaining screens below stay mock until their backend routes exist;
 * shapes are written to make that swap mechanical when they do.
 */

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  kind: "status" | "priority" | "general";
}

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n1",
    title: "Complaint moved to In Progress",
    body: "CMP-2026-0142 — a plumber has been assigned and is en route.",
    timestamp: "2026-08-03T08:12:00Z",
    read: false,
    kind: "status",
  },
  {
    id: "n2",
    title: "Priority raised",
    body: "CMP-2026-0139 priority was raised to Medium by Housing Office.",
    timestamp: "2026-08-02T15:40:00Z",
    read: false,
    kind: "priority",
  },
  {
    id: "n3",
    title: "Complaint resolved",
    body: "CMP-2026-0121 was marked resolved. Let us know if the issue returns.",
    timestamp: "2026-07-14T11:05:00Z",
    read: true,
    kind: "status",
  },
  {
    id: "n4",
    title: "Society notice",
    body: "Water supply will be suspended 2–4 PM tomorrow for tank cleaning.",
    timestamp: "2026-07-12T09:00:00Z",
    read: true,
    kind: "general",
  },
];

export interface MaintenanceService {
  id: string;
  name: string;
  description: string;
  icon: "flash" | "water" | "hammer" | "sparkles" | "leaf" | "shield-checkmark";
  phone: string;
  available: boolean;
}

export const MAINTENANCE_SERVICES: MaintenanceService[] = [
  { id: "s1", name: "Electrician", description: "Wiring, fixtures & power issues", icon: "flash", phone: "0800-100200", available: true },
  { id: "s2", name: "House Plumbing", description: "Leaks, drainage & fittings", icon: "water", phone: "0800-100201", available: true },
  { id: "s3", name: "Masonry", description: "Structural & wall repairs", icon: "hammer", phone: "0800-100202", available: false },
  { id: "s4", name: "Janitorial", description: "Cleaning & sanitation", icon: "sparkles", phone: "0800-100203", available: true },
  { id: "s5", name: "Horticulture", description: "Lawns, hedges & trees", icon: "leaf", phone: "0800-100204", available: true },
  { id: "s6", name: "Security", description: "Gate, patrol & access issues", icon: "shield-checkmark", phone: "0800-100205", available: true },
];

export interface PrayerTiming {
  id: string;
  name: string;
  arabicName: string;
  time: string;
  icon: "partly-sunny-outline" | "sunny-outline" | "cloudy-outline" | "moon-outline" | "star-outline" | "people-outline";
}

export const PRAYER_TIMINGS: PrayerTiming[] = [
  { id: "fajr", name: "Fajr", arabicName: "الفجر", time: "4:52 AM", icon: "partly-sunny-outline" },
  { id: "sunrise", name: "Sunrise", arabicName: "الشروق", time: "6:14 AM", icon: "sunny-outline" },
  { id: "dhuhr", name: "Dhuhr", arabicName: "الظهر", time: "12:18 PM", icon: "sunny-outline" },
  { id: "asr", name: "Asr", arabicName: "العصر", time: "4:47 PM", icon: "cloudy-outline" },
  { id: "maghrib", name: "Maghrib", arabicName: "المغرب", time: "7:02 PM", icon: "moon-outline" },
  { id: "isha", name: "Isha", arabicName: "العشاء", time: "8:24 PM", icon: "star-outline" },
  { id: "jummah", name: "Jummah", arabicName: "الجمعة", time: "1:30 PM", icon: "people-outline" },
];

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  icon: "flame" | "medkit" | "shield" | "business";
}

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  { id: "e1", name: "Fire", phone: "16", icon: "flame" },
  { id: "e2", name: "Ambulance", phone: "1122", icon: "medkit" },
  { id: "e3", name: "Security Control Room", phone: "051-9271234", icon: "shield" },
  { id: "e4", name: "Housing Office", phone: "051-9270000", icon: "business" },
];
