import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@hrm/database';

export type CreateEmployeeInput = {
  employeeNumber: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  workEmail?: string;
  personalEmail?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  jobTitle?: string;
  department?: string;
  location?: string;
  managerId?: string;
  employmentType?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN' | 'TEMPORARY';
  hireDate?: string;
  userId?: string;
  notes?: string;
};

@Injectable()
export class EmployeeService {
  async list(organizationId: string) {
    return prisma.employee.findMany({
      where: { organizationId },
      orderBy: [{ status: 'asc' }, { lastName: 'asc' }, { firstName: 'asc' }],
      include: { manager: { select: { id: true, employeeNumber: true, firstName: true, lastName: true } } },
    });
  }

  async get(organizationId: string, id: string) {
    const employee = await prisma.employee.findFirst({
      where: { id, organizationId },
      include: { manager: true, directReports: true, user: { select: { id: true, email: true, status: true } } },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  async create(organizationId: string, input: CreateEmployeeInput) {
    const employeeNumber = input.employeeNumber.trim();
    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();
    if (!employeeNumber || !firstName || !lastName) throw new BadRequestException('Employee number, first name and last name are required');

    if (input.managerId) {
      const manager = await prisma.employee.findFirst({ where: { id: input.managerId, organizationId } });
      if (!manager) throw new BadRequestException('Manager must belong to the same organization');
    }

    if (input.userId) {
      const user = await prisma.user.findUnique({ where: { id: input.userId } });
      if (!user) throw new BadRequestException('User not found');
      const linked = await prisma.employee.findUnique({ where: { userId: input.userId } });
      if (linked) throw new BadRequestException('User is already linked to an employee');
    }

    return prisma.employee.create({
      data: {
        organizationId,
        employeeNumber,
        firstName,
        lastName,
        preferredName: input.preferredName?.trim() || undefined,
        workEmail: input.workEmail?.trim().toLowerCase() || undefined,
        personalEmail: input.personalEmail?.trim().toLowerCase() || undefined,
        phone: input.phone?.trim() || undefined,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
        gender: input.gender?.trim() || undefined,
        jobTitle: input.jobTitle?.trim() || undefined,
        department: input.department?.trim() || undefined,
        location: input.location?.trim() || undefined,
        managerId: input.managerId,
        employmentType: input.employmentType,
        hireDate: input.hireDate ? new Date(input.hireDate) : undefined,
        userId: input.userId,
        notes: input.notes?.trim() || undefined,
      },
    });
  }

  async update(organizationId: string, id: string, input: Partial<CreateEmployeeInput>) {
    await this.get(organizationId, id);
    if (input.managerId === id) throw new BadRequestException('Employee cannot manage themselves');
    if (input.managerId) {
      const manager = await prisma.employee.findFirst({ where: { id: input.managerId, organizationId } });
      if (!manager) throw new BadRequestException('Manager must belong to the same organization');
    }
    return prisma.employee.update({
      where: { id },
      data: {
        employeeNumber: input.employeeNumber?.trim(), firstName: input.firstName?.trim(), lastName: input.lastName?.trim(),
        preferredName: input.preferredName?.trim(), workEmail: input.workEmail?.trim().toLowerCase(), personalEmail: input.personalEmail?.trim().toLowerCase(),
        phone: input.phone?.trim(), jobTitle: input.jobTitle?.trim(), department: input.department?.trim(), location: input.location?.trim(),
        managerId: input.managerId, employmentType: input.employmentType, hireDate: input.hireDate ? new Date(input.hireDate) : undefined,
        notes: input.notes?.trim(),
      },
    });
  }
}
