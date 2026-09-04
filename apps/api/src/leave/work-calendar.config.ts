import { Injectable } from '@nestjs/common';
import { DEFAULT_WORK_CALENDAR, type Holiday, type Weekday, type WorkCalendar } from './work-calendar';

@Injectable()
export class WorkCalendarConfigService {
  private readonly calendars = new Map<string, WorkCalendar>();

  get(organizationId: string): WorkCalendar {
    return this.calendars.get(organizationId) ?? DEFAULT_WORK_CALENDAR;
  }

  update(
    organizationId: string,
    input: { timezone?: string; workingDays?: Weekday[]; holidays?: Holiday[] },
  ): WorkCalendar {
    const current = this.get(organizationId);
    const next: WorkCalendar = {
      timezone: input.timezone ?? current.timezone,
      workingDays: input.workingDays ?? current.workingDays,
      holidays: input.holidays ?? current.holidays,
    };
    this.calendars.set(organizationId, next);
    return next;
  }
}
