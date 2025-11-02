/**
 * Parse date value from various formats to Date object
 * @param {string|Date|number} value - Date value to parse
 * @returns {Date|null} Parsed date or null if invalid
 */
export const parseDueDate = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    // Parse date string (YYYY-MM-DD) as local date, not UTC
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, year, month, day] = match.map(Number);
      const date = new Date(year, month - 1, day);
      return Number.isNaN(date.getTime()) ? null : date;
    }
    // Fallback for other date formats
    const normalized = value.length > 10 ? value : `${value}T00:00:00`;
    const date = new Date(normalized);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Convert Date to YYYY-MM-DD format using local timezone
 * @param {Date} date - Date to format
 * @returns {string|null} Formatted date string or null if invalid
 */
export const formatDateLocal = (date) => {
  if (!date) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

