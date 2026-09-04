import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@hrm/database';
import { Prisma } from '@prisma/client';

@Injectable()
export class LeaveService {
  private normalizeDate(value: string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw new BadRequestException('Invalid date');
    date.setUTCHours(0, 0, 0, 0);
    return date;
  }

  private workingDays(startDate: Date, endDate: Date): number {
    if (endDate < startDate) throw new BadRequestException('End date must be on or after start date');
    let total = 0;
    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      const day = cursor.getUTCDay();
      if (day !== 0 && day !== 6) total += 1;
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return total;
  }

  private async employeeForUser(organizationId: string, userId: string) {
    const employee = await prisma.employee.findFirst({ where: { organizationId, userId, status: { not: 'TERMINATED' } } });
    if (!employee) throw new NotFoundException('Employee profile not found');
    return employee;
  }

  async createRequestForUser(organizationId: string, userId: string, leaveTypeId: string, start: string, end: string, reason?: string) {
    const employee = await this.employeeForUser(organizationId, userId);
    return this.createRequest(organizationId, employee.id, leaveTypeId, start, end, reason);
  }

  async createRequest(organizationId: string, employeeId: string, leaveTypeId: string, start: string, end: string, reason?: string) {
    const startDate = this.normalizeDate(start);
    const endDate = this.normalizeDate(end);
    const days = this.workingDays(startDate, endDate);
    if (days <= 0) throw new BadRequestException('Leave request must contain at least one working day');

    return prisma.$transaction(async (tx) => {
      const employee = await tx.employee.findFirst({ where: { id: employeeId, organizationId, status: { not: 'TERMINATED' } } });
      if (!employee) throw new NotFoundException('Employee not found');
      const leaveType = await tx.leaveType.findFirst({ where: { id: leaveTypeId, organizationId, isActive: true } });
      if (!leaveType) throw new NotFoundException('Leave type not found');
      const overlap = await tx.leaveRequest.findFirst({ where: { organizationId, employeeId, status: { in: ['PENDING', 'APPROVED'] }, startDate: { lte: endDate }, endDate: { gte: startDate } } });
      if (overlap) throw new BadRequestException('An active leave request already overlaps these dates');
      const year = startDate.getUTCFullYear();
      const balance = await tx.leaveBalance.findUnique({ where: { employeeId_leaveTypeId_year: { employeeId, leaveTypeId, year } } });
      if (!balance) throw new BadRequestException('Leave balance has not been initialized for this year');
      const available = Number(balance.allocated) + Number(balance.carried) - Number(balance.used) - Number(balance.pending);
      if (available < days) throw new BadRequestException('Insufficient leave balance');
      const request = await tx.leaveRequest.create({ data: { organizationId, employeeId, leaveTypeId, startDate, endDate, workingDays: new Prisma.Decimal(days), reason: reason?.trim() || undefined } });
      await tx.leaveBalance.update({ where: { id: balance.id }, data: { pending: { increment: new Prisma.Decimal(days) } } });
      return request;
    });
  }

  async cancelRequestForUser(organizationId: string, userId: string, requestId: string) {
    const employee = await this.employeeForUser(organizationId, userId);
    return this.cancelRequest(organizationId, employee.id, requestId);
  }

  async cancelRequest(organizationId: string, employeeId: string, requestId: string) {
    return prisma.$transaction(async (tx) => {
      const request = await tx.leaveRequest.findFirst({ where: { id: requestId, organizationId, employeeId } });
      if (!request) throw new NotFoundException('Leave request not found');
      if (request.status !== 'PENDING') throw new BadRequestException('Only pending leave requests can be cancelled');
      const updated = await tx.leaveRequest.update({ where: { id: request.id }, data: { status: 'CANCELLED', cancelledAt: new Date() } });
      const year = request.startDate.getUTCFullYear();
      await tx.leaveBalance.updateMany({ where: { organizationId, employeeId, leaveTypeId: request.leaveTypeId, year }, data: { pending: { decrement: request.workingDays } } });
      return updated;
    });
  }

  async decide(organizationId: string, requestId: string, approverUserId: string, decision: 'APPROVED' | 'REJECTED', note?: string) {
    return prisma.$transaction(async (tx) => {
      const request = await tx.leaveRequest.findFirst({ where: { id: requestId, organizationId }, include: { employee: true } });
      if (!request) throw new NotFoundException('Leave request not found');
      if (request.status !== 'PENDING') throw new BadRequestException('Only pending leave requests can be decided');
      const manager = request.employee.managerId ? await tx.employee.findFirst({ where: { id: request.employee.managerId, organizationId } }) : null;
      if (!manager || manager.userId !== approverUserId) throw new BadRequestException('You are not authorized to decide this leave request');

      const year = request.startDate.getUTCFullYear();
      if (decision === 'APPROVED') {
        const balance = await tx.leaveBalance.findUnique({ where: { employeeId_leaveTypeId_year: { employeeId: request.employeeId, leaveTypeId: request.leaveTypeId, year } } });
        if (!balance || Number(balance.pending) < Number(request.workingDays)) throw new BadRequestException('Leave balance reservation is invalid');
        await tx.leaveBalance.update({ where: { id: balance.id }, data: { pending: { decrement: request.workingDays }, used: { increment: request.workingDays } } });
      } else {
        await tx.leaveBalance.updateMany({ where: { organizationId, employeeId: request.employeeId, leaveTypeId: request.leaveTypeId, year }, data: { pending: { decrement: request.workingDays } } });
      }

      return tx.leaveRequest.update({ where: { id: request.id }, data: { status: decision, approverUserId, decidedAt: new Date(), decisionNote: note?.trim() || undefined } });
    });
  }
}
