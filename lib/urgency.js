/**
 * Urgency tier calculator.
 * Determines visual urgency based on day of week and remaining chores.
 */

const URGENCY_MESSAGES = {
  cleared: "All done this week! 🎉",
  calm: "Plenty of time this week.",
  nudge: "A few days left — might want to get started.",
  elevated: "Tomorrow's the last day — wrapping up?",
  urgent: "Today's the last day for this week's chores!",
};

const URGENCY_SUBTEXT = {
  cleared: "Sit back and relax, you've earned it.",
  calm: "No rush — tackle them whenever it suits you.",
  nudge: "Still a comfortable window to knock them out.",
  elevated: "A good time to check a couple off the list.",
  urgent: "Let's get these wrapped up before midnight!",
};

/**
 * Get the urgency tier based on current date and remaining chore count.
 * @param {Date} date - Current date
 * @param {number} choresRemaining - Number of incomplete chores (0-4)
 * @returns {'cleared'|'calm'|'nudge'|'elevated'|'urgent'}
 */
export function getUrgencyTier(date, choresRemaining) {
  if (choresRemaining === 0) return 'cleared';

  const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon...6=Sat
  // Map to Mon-Sun week: Mon=0, Tue=1, ..., Sun=6
  const weekDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  if (weekDay <= 2) return 'calm';       // Mon–Wed
  if (weekDay <= 4) return 'nudge';      // Thu–Fri
  if (weekDay === 5) return 'elevated';  // Sat
  return 'urgent';                        // Sun
}

/**
 * Get the friendly message for an urgency tier.
 */
export function getUrgencyMessage(tier) {
  return URGENCY_MESSAGES[tier] || URGENCY_MESSAGES.calm;
}

/**
 * Get the subtext for an urgency tier.
 */
export function getUrgencySubtext(tier) {
  return URGENCY_SUBTEXT[tier] || URGENCY_SUBTEXT.calm;
}
