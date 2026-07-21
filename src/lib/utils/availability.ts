/**
 * Clinic availability configuration and slot helpers.
 *
 * Availability is derived from fixed clinic hours minus slots already taken by
 * existing appointments (computed elsewhere). Hourly slots.
 */

export const CLINIC_OPEN_HOUR = 8;   // first slot starts at 08:00
export const CLINIC_LAST_SLOT_HOUR = 16; // last slot starts at 16:00
export const CLOSED_WEEKDAYS = [0]; // 0 = Sunday

export function isClinicClosed(date: Date): boolean {
    return CLOSED_WEEKDAYS.includes(date.getDay());
}

/**
 * Generate the clinic's hourly slot start-times for a given day.
 * Returns an empty array for closed days.
 */
export function generateDaySlots(date: Date): Date[] {
    if (isClinicClosed(date)) return [];

    const slots: Date[] = [];
    for (let hour = CLINIC_OPEN_HOUR; hour <= CLINIC_LAST_SLOT_HOUR; hour++) {
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
