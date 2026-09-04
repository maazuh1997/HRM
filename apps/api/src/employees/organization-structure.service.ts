import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@hrm/database';

@Injectable()
export class OrganizationStructureService {
  async createDepartment(organizationId: string, name: string, parentId?: string) {
    const normalizedName = name.trim();
    if (normalizedName.length < 2) throw new BadRequestException('Department name is too short');
    if (parentId) {
      const parent = await prisma.department.findFirst({ where: { id: parentId, organizationId } });
      if (!parent) throw new NotFoundException('Parent department not found');
    }
    return prisma.department.create({ data: { organizationId, name: normalizedName, parentId } });
  }

  async createPosition(organizationId: string, title: string, departmentId?: string) {
    const normalizedTitle = title.trim();
    if (normalizedTitle.length < 2) throw new BadRequestException('Position title is too short');
    if (departmentId) {
      const department = await prisma.department.findFirst({ where: { id: departmentId, organizationId } });
      if (!department) throw new NotFoundException('Department not found');
    }
    return prisma.position.create({ data: { organizationId, title: normalizedTitle, departmentId } });
  }

  async getDepartments(organizationId: string) {
    return prisma.department.findMany({
      where: { organizationId },
      include: { parent: true, children: true, positions: true },
      orderBy: { name: 'asc' },
    });
  }

  async getPositions(organizationId: string) {
    return prisma.position.findMany({
      where: { organizationId },
      include: { department: true },
      orderBy: { title: 'asc' },
    });
  }
}
