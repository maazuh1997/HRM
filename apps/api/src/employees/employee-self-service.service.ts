import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@hrm/database';

@Injectable()
export class EmployeeSelfService {
  async getMyProfile(userId: string, organizationId: string) {
    const employee = await prisma.employee.findFirst({
      where: { organizationId, userId },
      include: { department: true, position: true, manager: true },
    });
    if (!employee) throw new NotFoundException('Employee profile not found');
    return employee;
  }

  async updateMyContact(userId: string, organizationId: string, email?: string, phone?: string) {
    const employee = await prisma.employee.findFirst({ where: { organizationId, userId } });
    if (!employee) throw new NotFoundException('Employee profile not found');
    if (email && email.trim().toLowerCase() !== employee.personalEmail?.toLowerCase()) {
      throw new ForbiddenException('Work email is managed by HR');
    }
    return prisma.employee.update({
      where: { id: employee.id },
      data: { personalEmail: email?.trim().toLowerCase() || employee.personalEmail, phone: phone?.trim() || employee.phone },
    });
  }
}
