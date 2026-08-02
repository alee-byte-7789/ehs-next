/**
 * Placeholder data for screens whose backend endpoints aren't wired into
 * the mobile app yet (complaints, maintenance, notifications). Shapes are
 * written to mirror the eventual API contracts described in
 * PROJECT_ROADMAP.md, so swapping these for real `useQuery` calls later —
 * the same way `lib/resident-queries.ts` already does for `/residents/me`
 * — should mean changing the data source, not the screens.
 */

export type ComplaintStatus =
  | "pending"
  | "accepted"
  | "assigned"
  | "in_progress"
  | "resolved"
  | "reopened"
  | "closed";

export type Priority = "low" | "medium" | "high";

export interface ComplaintSummary {
  id: string;
  code: string;
  category: string;
  priority: Priority;
  status: ComplaintStatus;
  submittedAt: string;
  department?: string;
  title: string;
  description?: string;
}

export const MOCK_COMPLAINTS: ComplaintSummary[] = [
  {
    id: "1",
    code: "CMP-2026-0142",
    category: "Plumbing",
    priority: "high",
    status: "in_progress",
    submittedAt: "2026-07-29",
    department: "Maintenance",
    title: "Kitchen sink leaking under the cabinet",
    description:
      "Water has been pooling under the kitchen sink cabinet for the last two days. It looks like the joint below the tap is loose. Would appreciate a quick visit before it damages the cabinet base.",
  },
  {
    id: "2",
    code: "CMP-2026-0139",
    category: "Electrical",
    priority: "medium",
    status: "assigned",
    submittedAt: "2026-07-26",
    department: "Maintenance",
    title: "Flickering light in the drawing room",
    description:
      "The main ceiling light in the drawing room flickers on and off, especially in the evening. Might be a loose connection or a failing switch.",
  },
  {
    id: "3",
    code: "CMP-2026-0121",
    category: "Security",
    priority: "low",
    status: "resolved",
    submittedAt: "2026-07-14",
    department: "Security",
    title: "Gate boom barrier slow to respond",
    description: "The main gate's boom barrier takes 10-15 seconds to lift after the card is scanned, causing a small queue during peak hours.",
  },
  {
    id: "4",
    code: "CMP-2026-0108",
    category: "Horticulture",
    priority: "low",
    status: "closed",
    submittedAt: "2026-06-30",
    department: "Horticulture",
    title: "Overgrown hedge blocking driveway view",
    description: "The hedge near the driveway entrance has grown tall enough to block the view of oncoming traffic when reversing out.",
  },
];

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

export type MosqueName = "bilal_mosque" | "markazi_jamia_mosque";

export interface PrayerTiming {
  mosque_name: MosqueName;
  label: string;
  fajr: string;
  zuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
  jummah: string | null;
  updatedAt: string;
}

export const MOCK_PRAYER_TIMINGS: PrayerTiming[] = [
  {
    mosque_name: "bilal_mosque",
    label: "Bilal Mosque",
    fajr: "4:45 AM",
    zuhr: "1:30 PM",
    asr: "5:15 PM",
    maghrib: "7:05 PM",
    isha: "8:30 PM",
    jummah: "1:45 PM",
    updatedAt: "2026-08-01",
  },
  {
    mosque_name: "markazi_jamia_mosque",
    label: "Markazi Jamia Mosque",
    fajr: "4:50 AM",
    zuhr: "1:35 PM",
    asr: "5:20 PM",
    maghrib: "7:05 PM",
    isha: "8:35 PM",
    jummah: "1:50 PM",
    updatedAt: "2026-08-01",
  },
];

export const COMPLAINT_CATEGORIES = [
  "Plumbing",
  "Electrical",
  "Structural",
  "Security",
  "Horticulture",
  "Sanitation",
  "Other",
] as const;

export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number];
