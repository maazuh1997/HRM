import { Body, Controller, createParamDecorator, ExecutionContext, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { RequirePermission } from '../authorization/permission.decorator';
import { PermissionGuard } from '../authorization/permission.guard';
import { TenantGuard } from '../organizations/tenant.guard';
import type { TenantRequest } from '../organizations/organization-context';
import { EmployeeService, type CreateEmployeeInput } from './employee.service';

const Tenant = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<TenantRequest>();
  return request;
});

@Controller('employees')
@UseGuards(TenantGuard, PermissionGuard)
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Get()
  @RequirePermission('employees', 'read')
  list(@Tenant() request: TenantRequest) {
    return this.employeeService.list(request.tenant!.id);
  }

  @Get(':id')
  @RequirePermission('employees', 'read')
  get(@Tenant() request: TenantRequest, @Param('id') id: string) {
    return this.employeeService.get(request.tenant!.id, id);
  }

  @Post()
  @RequirePermission('employees', 'create')
  create(@Tenant() request: TenantRequest, @Body() body: CreateEmployeeInput) {
    return this.employeeService.create(request.tenant!.id, body);
  }

  @Patch(':id')
  @RequirePermission('employees', 'update')
  update(@Tenant() request: TenantRequest, @Param('id') id: string, @Body() body: Partial<CreateEmployeeInput>) {
    return this.employeeService.update(request.tenant!.id, id, body);
  }
}
