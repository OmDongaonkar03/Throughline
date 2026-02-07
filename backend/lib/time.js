import { ValidationError } from '../utils/errors.js';

export function getCurrentTimeInUserTz() {
  // For beta: Single timezone for all users
  const timezone = process.env.TZ || "Asia/Kolkata";
  return new Date();
}

export function getUserHour() {
  return getCurrentTimeInUserTz().getHours();
}

export function getUserMinute() {
  return getCurrentTimeInUserTz().getMinutes();
}

// Get start of day for a given date
export function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Get end of day for a given date
export function endOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

// Get start of week (Monday) for a given date
export function startOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  const monday = new Date(d.setDate(diff));
  return startOfDay(monday);
}

// Get end of week (Sunday) for a given date
export function endOfWeek(date = new Date()) {
  const monday = startOfWeek(date);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return endOfDay(sunday);
}

// Get start of month for a given date
export function startOfMonth(date = new Date()) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

// Get end of month for a given date
export function endOfMonth(date = new Date()) {
  const d = new Date(date);
  return endOfDay(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

// Check if time matches schedule (hour:minute format)
export function isTimeMatch(
  scheduledTime,
  currentHour,
  currentMinute,
  windowMinutes = 15
) {
  const [schedHour, schedMinute] = scheduledTime.split(":").map(Number);

  // Check if we're in the same hour
  if (currentHour !== schedHour) {
    return false;
  }

  // Check if we're within the window
  const timeDiff = Math.abs(currentMinute - schedMinute);
  return timeDiff < windowMinutes;
}

// Parse time string to hour and minute
export function parseTime(timeStr) {
  const [hour, minute] = timeStr.split(":").map(Number);
  return { hour, minute };
}

// Format date to YYYY-MM-DD
export function formatDate(date) {
  return date.toISOString().split("T")[0];
}

// Get yesterday's date
export function getYesterday() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return startOfDay(yesterday);
}

// Get today's date (start of day)
export function getToday() {
  return startOfDay(new Date());
}

/**
 * Validate and parse a date string
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @param {Object} options - Validation options
 * @param {boolean} options.allowFuture - Allow future dates (default: false)
 * @param {number} options.maxPastYears - Maximum years in the past (default: 2)
 * @returns {Date} - Valid Date object
 * @throws {ValidationError} - If date is invalid
 */
export function validateAndParseDate(dateString, options = {}) {
  const {
    allowFuture = false,
    maxPastYears = 2,
  } = options;

  // Check if dateString is provided
  if (!dateString) {
    throw new ValidationError('Date is required');
  }

  // Check format YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    throw new ValidationError('Date must be in YYYY-MM-DD format');
  }

  // Parse the date as local midnight to respect server/user timezone
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  // Check if date is valid
  if (!isValidDate(date)) {
    throw new ValidationError('Invalid date');
  }

  // Validate date components match input (catches invalid dates like 2024-02-30)
  if (
    date.getFullYear() !== year ||
    date.getMonth() + 1 !== month ||
    date.getDate() !== day
  ) {
    throw new ValidationError('Invalid date (day/month/year combination is not valid)');
  }

  const now = new Date();
  const today = startOfDay(now);

  // Check future date restriction
  if (!allowFuture && date > today) {
    throw new ValidationError('Date cannot be in the future');
  }

  // Check past date restriction
  const maxPastDate = new Date(now);
  maxPastDate.setFullYear(now.getFullYear() - maxPastYears);

  if (date < startOfDay(maxPastDate)) {
    throw new ValidationError(`Date cannot be more than ${maxPastYears} years in the past`);
  }

  return date;
}

/**
 * Validate date for post generation
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @param {string} type - Post type (DAILY, WEEKLY, MONTHLY)
 * @returns {Date} - Valid Date object
 * @throws {ValidationError} - If date is invalid
 */
export function validatePostDate(dateString, type = 'DAILY') {
  const date = validateAndParseDate(dateString, {
    allowFuture: false,
    maxPastYears: 2,
  });

  const today = getToday();
  const yesterday = getYesterday();

  // Additional validation based on post type
  switch (type) {
    case 'DAILY':
      // Daily posts can be from yesterday or earlier
      // (today's post might not have check-ins yet)
      if (date > yesterday) {
        throw new ValidationError(
          'Cannot generate daily post for today. Please wait until end of day or select a past date.'
        );
      }
      break;

    case 'WEEKLY':
      // Weekly posts should be for completed weeks
      const currentWeekStart = startOfWeek(today);
      if (date >= currentWeekStart) {
        throw new ValidationError(
          'Cannot generate weekly post for current week. Please wait until week ends or select a past week.'
        );
      }
      break;

    case 'MONTHLY':
      // Monthly posts should be for completed months
      const currentMonthStart = startOfMonth(today);
      if (date >= currentMonthStart) {
        throw new ValidationError(
          'Cannot generate monthly post for current month. Please wait until month ends or select a past month.'
        );
      }
      break;
  }

  return date;
}

/**
 * Check if a date object is valid
 * @param {Date} date - Date object to check
 * @returns {boolean} - True if valid
 */
export function isValidDate(date) {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Safely parse a date with fallback
 * @param {string|Date} input - Date string or Date object
 * @param {Date} fallback - Fallback date (default: today)
 * @returns {Date} - Valid Date object
 */
export function safeParseDate(input, fallback = null) {
  if (!input) {
    return fallback || getToday();
  }

  if (input instanceof Date) {
    return isValidDate(input) ? input : (fallback || getToday());
  }

  try {
    const parsed = new Date(input);
    return isValidDate(parsed) ? parsed : (fallback || getToday());
  } catch {
    return fallback || getToday();
  }
}

