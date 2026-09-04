import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@hrm/database';
import { calculateWorkingDays, DEFAULT_WORK_CALENDAR, type WorkCalendar } from './work-calendar';

@Injectable()
export class WorkCalendarService {
  private readonly calendars = new Map<string, WorkCalendar>();

  get(organizationId: string): WorkCalendar {
    return this.calendars.get(organizationId) ?? DEFAULT_WORK_CALENDAR;
  }

  set(organizationId: string, calendar: WorkCalendar): WorkCalendar {
    this.calendars.set(organizationId, calendar);
    return calendar;
  }

  calculate(organizationId: string, startDate: Date, endDate: Date): number {
    return calculateWorkingDays(startDate, endDate, this.get(organizationId));
  }

  async validateOrganization(organizationId: string): Promise<void> {
    const organization = await prisma.organization.findUnique({ where: { id: organizationId }, select: { id: true } });
    if (!organization) throw new NotFoundException('Organization not found');
  }
}
