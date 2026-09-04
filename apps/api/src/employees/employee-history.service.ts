import { Injectable } from '@nestjs/common';
import { prisma } from '@hrm/database';

@Injectable()
export class EmployeeHistoryService {
  async record(
    organizationId: string,
    employeeId: string,
    actorUserId: string,
    type: string,
    previousValue?: unknown,
    newValue?: unknown,
  ) {
    return prisma.employeeHistory.create({
      data: {
        organizationId,
        employeeId,
        actorUserId,
        type,
        previousValue: previousValue === undefined ? undefined : JSON.stringify(previousValue),
        newValue: newValue === undefined ? undefined : JSON.stringify(newValue),
      },
    });
  }
}
