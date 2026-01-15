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
