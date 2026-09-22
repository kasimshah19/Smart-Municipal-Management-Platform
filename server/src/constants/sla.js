export const SLA_DURATIONS_HOURS = {
  LOW: 72,
  MEDIUM: 48,
  HIGH: 24,
  CRITICAL: 8
};

/**
 * Calculates the SLA Due Date based on priority
 * @param {string} priority - 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
 * @param {Date} startDate - the start date
 * @returns {Date} 
 */
export const calculateSlaDueDate = (priority, startDate = new Date()) => {
  const hours = SLA_DURATIONS_HOURS[priority] || SLA_DURATIONS_HOURS.MEDIUM;
  return new Date(startDate.getTime() + hours * 60 * 60 * 1000);
};
