/**
 * Placeholder data for screens whose backend has NO endpoint at all yet
 * (notifications, emergency contacts). Complaints and prayer timings are
 * NOT here anymore — see `lib/complaint-queries.ts` and `lib/society-queries.ts`,
 * which call the real APIs against your Supabase-backed database.
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

export interface PrayerTiming {
  id: string;
  name: string;
  arabicName: string;
  time: string;
  icon: "partly-sunny" | "sunny" | "cloudy" | "moon" | "star" | "people";
}

export const PRAYER_TIMINGS: PrayerTiming[] = [
  { id: "fajr", name: "Fajr", arabicName: "الفجر", time: "4:52 AM", icon: "partly-sunny" },
  { id: "sunrise", name: "Sunrise", arabicName: "الشروق", time: "6:14 AM", icon: "sunny" },
  { id: "dhuhr", name: "Dhuhr", arabicName: "الظهر", time: "12:18 PM", icon: "sunny" },
  { id: "asr", name: "Asr", arabicName: "العصر", time: "4:47 PM", icon: "cloudy" },
  { id: "maghrib", name: "Maghrib", arabicName: "المغرب", time: "7:02 PM", icon: "moon" },
  { id: "isha", name: "Isha", arabicName: "العشاء", time: "8:24 PM", icon: "star" },
  { id: "jummah", name: "Jummah", arabicName: "الجمعة", time: "1:30 PM", icon: "people" },
];

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  icon: "flame" | "medkit" | "shield" | "business" | "call" | "person";
}

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  { id: "e1", name: "Complaint Office", phone: "03334256595", icon: "business" },
  { id: "e2", name: "Complaint Office (Landline)", phone: "0514256595", icon: "call" },
  { id: "e3", name: "EHS Security Reception (Main Gate)", phone: "0514256594", icon: "shield" },
  { id: "e4", name: "CSO", phone: "03215081947", icon: "person" },
];

export interface MaintenanceService {
  id: string;
  name: string;
  description: string;
  phone: string;
  available: boolean;
  icon: "water" | "flash" | "hammer" | "trash" | "leaf" | "construct";
}

/** Placeholder like the sections above — no `/maintenance-services`
 * backend route exists yet. Routes calls through the real Complaint
 * Office number (see EMERGENCY_CONTACTS) until each service has its own
 * dedicated line the admin can configure. */
export const MAINTENANCE_SERVICES: MaintenanceService[] = [
  { id: "m1", name: "Plumbing", description: "Leaks, blockages, water supply issues.", phone: "03334256595", available: true, icon: "water" },
  { id: "m2", name: "Electrical", description: "Wiring faults, outages, fixture repairs.", phone: "03334256595", available: true, icon: "flash" },
  { id: "m3", name: "Carpentry", description: "Doors, windows, furniture repairs.", phone: "0514256595", available: true, icon: "hammer" },
  { id: "m4", name: "Sanitation", description: "Garbage collection and disposal.", phone: "0514256595", available: true, icon: "trash" },
  { id: "m5", name: "Gardening", description: "Lawn care and common-area landscaping.", phone: "0514256595", available: false, icon: "leaf" },
  { id: "m6", name: "General Maintenance", description: "Anything else — we'll route it to the right team.", phone: "03334256595", available: true, icon: "construct" },
];
