/**
 * Clinic / doctor availability configuration and slot helpers.
 *
 * A doctor's availability is a weekly schedule (per weekday: working or off,
 * plus start/end hours). Bookable slots = the day's schedule minus slots already
 * taken by existing appointments (computed elsewhere). Hourly slots.
 *
 * When a doctor has no custom schedule, DEFAULT_AVAILABILITY applies.
 */

export interface DaySchedule {
    enabled: boolean;
    /** Opening hour, 0-23. */
    start: number;
    /** Closing hour, 0-23 (exclusive — the last slot starts at end-1). */
    end: number;
}

/** Keyed by weekday: '0' = Sunday … '6' = Saturday. */
export type WeeklyAvailability = Record<string, DaySchedule>;

export const CLINIC_OPEN_HOUR = 8;
export const CLINIC_CLOSE_HOUR = 17;

export const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Default: Mon–Sat 08:00–17:00, closed Sunday.
export const DEFAULT_AVAILABILITY: WeeklyAvailability = {
    '0': { enabled: false, start: CLINIC_OPEN_HOUR, end: CLINIC_CLOSE_HOUR },
    '1': { enabled: true, start: CLINIC_OPEN_HOUR, end: CLINIC_CLOSE_HOUR },
    '2': { enabled: true, start: CLINIC_OPEN_HOUR, end: CLINIC_CLOSE_HOUR },
    '3': { enabled: true, start: CLINIC_OPEN_HOUR, end: CLINIC_CLOSE_HOUR },
    '4': { enabled: true, start: CLINIC_OPEN_HOUR, end: CLINIC_CLOSE_HOUR },
    '5': { enabled: true, start: CLINIC_OPEN_HOUR, end: CLINIC_CLOSE_HOUR },
    '6': { enabled: true, start: CLINIC_OPEN_HOUR, end: CLINIC_CLOSE_HOUR },
};

/** The schedule that applies to a given date, falling back to the default. */
export function scheduleForDate(date: Date, availability?: WeeklyAvailability | null): DaySchedule {
    const key = String(date.getDay());
    return availability?.[key] ?? DEFAULT_AVAILABILITY[key];
}

/** True if the doctor works on this date. */
export function isDayOpen(date: Date, availability?: WeeklyAvailability | null): boolean {
    const sched = scheduleForDate(date, availability);
    return sched.enabled && sched.end > sched.start;
}

/**
 * Generate the hourly slot start-times for a given day.
 * Returns an empty array when the doctor is off that day.
 */
export function generateDaySlots(date: Date, availability?: WeeklyAvailability | null): Date[] {
    const sched = scheduleForDate(date, availability);
    if (!sched.enabled || sched.end <= sched.start) return [];

    const slots: Date[] = [];
    for (let hour = sched.start; hour < sched.end; hour++) {
        const slot = new Date(date);
        slot.setHours(hour, 0, 0, 0);
        slots.push(slot);
    }
    return slots;
}

/** True if the slot start-time is already in the past. */
export function isPast(slot: Date): boolean {
    return slot.getTime() < Date.now();
}

/** The next date (from `from`, inclusive) the doctor is open. Falls back to `from`. */
export function nextOpenDay(from: Date, availability?: WeeklyAvailability | null): Date {
    const cursor = new Date(from);
    cursor.setHours(0, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
        if (isDayOpen(cursor, availability)) return cursor;
        cursor.setDate(cursor.getDate() + 1);
    }
    return new Date(from);
}
