import type { ComplaintCategory } from "./types";

/**
 * Predefined subcategory choices per category, selected via buttons/chips
 * rather than free typing. "Other" always included as an escape hatch,
 * which reveals a free-text field when selected (see new.tsx).
 */
export const SUBCATEGORY_OPTIONS: Record<ComplaintCategory, string[]> = {
  general: ["Noise Complaint", "Parking Issue", "Pet Nuisance", "Security Concern", "Other"],
  infrastructure: [
    "Water Leakage",
    "Electricity Issue",
    "Sewerage / Drainage",
    "Road / Street Damage",
    "Gas Supply",
    "Street Light",
    "Other",
  ],
  internal: ["Staff Behavior", "Society Rules Violation", "Maintenance Fee Issue", "Common Area Issue", "Other"],
};
