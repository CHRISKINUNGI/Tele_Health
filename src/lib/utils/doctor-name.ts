/**
 * Format a doctor's display name with a single "Dr." prefix.
 *
 * Names may be stored either with or without the prefix (e.g. "Dr. Sarah
 * Johnson" or "Sarah Johnson"), so this avoids producing "Dr. Dr. …".
 */
export function formatDoctorName(name?: string | null): string {
    const trimmed = (name || '').trim();
    if (!trimmed) return 'Assigned Provider';
    if (/^dr\.?\s/i.test(trimmed)) return trimmed;
    return `Dr. ${trimmed}`;
}
