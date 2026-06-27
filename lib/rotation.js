/**
 * Rotation logic — pure date math, no database dependencies.
 * Shared between server and client.
 */

const ROTATION_START_YEAR = 2026;
const ROTATION_START_MONTH = 5; // 0-indexed: June
const ROTATION_START_DAY = 22;

export const PEOPLE = [
  { id: 1, name: 'Sarvesh', initial: 'S', color: '#8FAE8B' },
  { id: 2, name: 'Jayesh', initial: 'J', color: '#7BA3C9' },
  { id: 3, name: 'Om', initial: 'O', color: '#C9A07B' },
  { id: 4, name: 'Saiprasad', initial: 'SP', color: '#B87BC9' },
];

export const CHORES = [
  { id: 1, name: 'Clean the Bathroom', icon: '🚿', displayOrder: 0 },
  { id: 2, name: 'Clean the Commode/Toilet', icon: '🚽', displayOrder: 1 },
  { id: 3, name: 'Take the Trash Out', icon: '🗑️', displayOrder: 2 },
  { id: 4, name: 'Clean the Kitchen', icon: '🍳', displayOrder: 3 },
];

/**
 * Get rotation info for a specific date.
 * Returns null if date is before the rotation start.
 */
export function getWeekInfo(date = new Date()) {
  const startMs = Date.UTC(ROTATION_START_YEAR, ROTATION_START_MONTH, ROTATION_START_DAY);
  const nowMs = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());

  const daysSinceStart = Math.floor((nowMs - startMs) / (1000 * 60 * 60 * 24));
  const weekIndex = Math.floor(daysSinceStart / 7);

  if (weekIndex < 0) return null;

  const personIndex = ((weekIndex % 4) + 4) % 4;
  const person = PEOPLE[personIndex];

  const weekStartMs = startMs + weekIndex * 7 * 24 * 60 * 60 * 1000;
  const monday = new Date(weekStartMs);
  const sunday = new Date(weekStartMs + 6 * 24 * 60 * 60 * 1000);

  return {
    weekIndex,
    personIndex,
    person,
    monday,
    sunday,
    weekStartISO: formatDateISO(monday),
    mondayDisplay: formatDateDisplay(monday),
    sundayDisplay: formatDateDisplay(sunday),
  };
}

/**
 * Get a range of weeks for the rotation timeline.
 */
export function getRotationSchedule(weeksBefore = 8, weeksAfter = 8) {
  const today = new Date();
  const currentWeek = getWeekInfo(today);
  if (!currentWeek) return [];

  const weeks = [];
  for (let offset = -weeksBefore; offset <= weeksAfter; offset++) {
    const targetDate = new Date(
      Date.UTC(ROTATION_START_YEAR, ROTATION_START_MONTH, ROTATION_START_DAY) +
        (currentWeek.weekIndex + offset) * 7 * 24 * 60 * 60 * 1000
    );
    const weekInfo = getWeekInfo(targetDate);
    if (weekInfo) {
      weeks.push({
        ...weekInfo,
        isCurrent: offset === 0,
        isPast: offset < 0,
        isFuture: offset > 0,
      });
    }
  }

  return weeks;
}

/**
 * Get week info for a specific weekStart ISO date string.
 */
export function getWeekInfoByStartDate(weekStartISO) {
  const parts = weekStartISO.split('-');
  const date = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
  return getWeekInfo(date);
}

/** Format a UTC date as YYYY-MM-DD */
export function formatDateISO(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Format a UTC date as "Jun 22" */
export function formatDateDisplay(date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getUTCMonth()]} ${date.getUTCDate()}`;
}

/** Format a UTC date as "Monday, Jun 22" */
export function formatDateFull(date) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return `${days[date.getUTCDay()]}, ${formatDateDisplay(date)}`;
}
