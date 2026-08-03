import type { ComplaintCategory } from "./types";

/**
 * Predefined subcategory choices per category, selected via buttons/chips
 * rather than free typing. "Other" always included as an escape hatch,
 * which reveals a free-text field when selected (see complaints/new.tsx).
 *
 * Ported from the old mobile app — the redesign batches replaced this
 * picker with a single free-text title field, which is the "subcategory
 * buttons not working" bug (the buttons just weren't there anymore).
 */
export const SUBCATEGORY_OPTIONS: Record<ComplaintCategory, string[]> = {
  general: ["Parking Issue", "Pet Nuisance", "Security Concern", "Other"],
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
