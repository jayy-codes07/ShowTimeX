/**
 * Format date to display format (e.g., "25 Jan 2024")
 */
export const formatDate = (date) => {
  const d = new Date(date);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

/**
 * Format date using UTC calendar day to avoid timezone day-shift for date-only values
 */
export const formatDateUTC = (date) => {
  const d = new Date(date);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};

/**
 * Format date to full format (e.g., "25 January 2024, 06:30 PM")
 */
export const formatDateFull = (date) => {
  const d = new Date(date);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
  
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${displayHours}:${displayMinutes} ${ampm}`;
};

/**
 * Format time from 24hr to 12hr format
 */
export const formatTime = (time) => {
  if (!time) return '';

  const normalizedTime = time.toString().trim();

  // Preserve existing 12-hour format to avoid AM/PM flipping.
  const twelveHourMatch = normalizedTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (twelveHourMatch) {
    const hours = parseInt(twelveHourMatch[1], 10);
    const minutes = twelveHourMatch[2];
    const meridiem = twelveHourMatch[3].toUpperCase();

    if (hours >= 1 && hours <= 12) {
      return `${hours}:${minutes} ${meridiem}`;
    }

    return normalizedTime;
  }

  const twentyFourHourMatch = normalizedTime.match(/^(\d{1,2}):(\d{2})$/);
  if (!twentyFourHourMatch) return normalizedTime;

  const hours24 = parseInt(twentyFourHourMatch[1], 10);
  const minutes = twentyFourHourMatch[2];

  if (Number.isNaN(hours24) || hours24 < 0 || hours24 > 23) {
    return normalizedTime;
  }

  const meridiem = hours24 >= 12 ? 'PM' : 'AM';
  const displayHours = hours24 % 12 || 12;

  return `${displayHours}:${minutes} ${meridiem}`;
};

/**
 * Get day of week from date
 */
export const getDayOfWeek = (date) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const d = new Date(date);
  return days[d.getDay()];
};

/**
 * Get short day of week from date
 */
export const getShortDayOfWeek = (date) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const d = new Date(date);
  return days[d.getDay()];
};

/**
 * Check if date is today
 */
export const isToday = (date) => {
  const today = new Date();
  const d = new Date(date);
  
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
};

/**
 * Check if date is tomorrow
 */
export const isTomorrow = (date) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const d = new Date(date);
  
  return (
    d.getDate() === tomorrow.getDate() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getFullYear() === tomorrow.getFullYear()
  );
};

/**
 * Get relative date string (Today, Tomorrow, or date)
 */
export const getRelativeDate = (date) => {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return formatDate(date);
};

/**
 * Get date range for next N days
 */
export const getNextDays = (count = 7) => {
  const days = [];
  const today = new Date();
  
  for (let i = 0; i < count; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    days.push(date);
  }
  
  return days;
};

/**
 * Format duration in minutes to hours and minutes
 */
export const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

/**
 * Parse date string to Date object
 */
export const parseDate = (dateString) => {
  return new Date(dateString);
};

/**
 * Format date for API (YYYY-MM-DD)
 */
export const formatDateForAPI = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

export default {
  formatDate,
  formatDateUTC,
  formatDateFull,
  formatTime,
  getDayOfWeek,
  getShortDayOfWeek,
  isToday,
  isTomorrow,
  getRelativeDate,
  getNextDays,
  formatDuration,
  parseDate,
  formatDateForAPI,
};