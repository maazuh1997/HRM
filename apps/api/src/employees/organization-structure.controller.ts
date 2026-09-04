import { Body, Controller, Get, Headers, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { OrganizationStructureService } from './organization-structure.service';

class CreateDepartmentDto {
  name!: string;
  parentId?: string;
}

class CreatePositionDto {
  title!: string;
  departmentId?: string;
}

@Controller('employees/organization-structure')
@UseGuards(AuthGuard)
export class OrganizationStructureController {
  constructor(private readonly service: OrganizationStructureService) {}

  @Post('departments')
  createDepartment(@Headers('x-organization-id') organizationId: string, @Body() body: CreateDepartmentDto) {
    if (!organizationId) throw new Error('Organization context is required');
    return this.service.createDepartment(organizationId, body.name, body.parentId);
  }

  @Get('departments')
  getDepartments(@Headers('x-organization-id') organizationId: string) {
    if (!organizationId) throw new Error('Organization context is required');
    return this.service.getDepartments(organizationId);
  }

  @Post('positions')
  createPosition(@Headers('x-organization-id') organizationId: string, @Body() body: CreatePositionDto) {
    if (!organizationId) throw new Error('Organization context is required');
    return this.service.createPosition(organizationId, body.title, body.departmentId);
  }

  @Get('positions')
  getPositions(@Headers('x-organization-id') organizationId: string) {
    if (!organizationId) throw new Error('Organization context is required');
    return this.service.getPositions(organizationId);
  }
}
