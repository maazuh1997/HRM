export const WORKING_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as const;

export type Weekday =
  | 'SUNDAY'
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY';

export type Holiday = {
  date: string;
  name: string;
  recurring?: boolean;
};

export type WorkCalendar = {
  timezone: string;
  workingDays: Weekday[];
  holidays: Holiday[];
};

export const DEFAULT_WORK_CALENDAR: WorkCalendar = {
  timezone: 'UTC',
  workingDays: [...WORKING_DAYS],
  holidays: [],
};

export function isWorkingDay(date: Date, calendar: WorkCalendar): boolean {
  const weekdays: Weekday[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  return calendar.workingDays.includes(weekdays[date.getUTCDay()]);
}

export function isHoliday(date: Date, calendar: WorkCalendar): boolean {
  const key = date.toISOString().slice(0, 10);
  return calendar.holidays.some((holiday) => {
    if (holiday.date === key) return true;
    if (!holiday.recurring) return false;
    return holiday.date.slice(5) === key.slice(5);
  });
}

export function calculateWorkingDays(startDate: Date, endDate: Date, calendar: WorkCalendar): number {
  if (endDate < startDate) return 0;
  let total = 0;
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    if (isWorkingDay(cursor, calendar) && !isHoliday(cursor, calendar)) total += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return total;
}
