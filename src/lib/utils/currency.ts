/**
 * Format a monetary amount as Kenyan Shillings (KES).
 *
 * @example
 * formatKes(2500) // "Ksh 2,500"
 * formatKes(null) // "Fee on request"
 */
export function formatKes(amount?: number | null): string {
    if (amount === null || amount === undefined || Number.isNaN(amount)) {
        return 'Fee on request';
    }

    const formatted = new Intl.NumberFormat('en-KE', {
        maximumFractionDigits: 0,
    }).format(amount);

    return `Ksh ${formatted}`;
}
