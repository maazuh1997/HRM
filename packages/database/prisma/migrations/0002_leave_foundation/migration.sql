CREATE TYPE "LeaveRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

CREATE TABLE "LeaveType" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT,
  "description" TEXT,
  "paid" BOOLEAN NOT NULL DEFAULT true,
  "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
  "requiresAttachment" BOOLEAN NOT NULL DEFAULT false,
  "annualAllocationDays" DECIMAL(8,2),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LeaveType_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LeaveType_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "LeaveBalance" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "leaveTypeId" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "allocatedDays" DECIMAL(8,2) NOT NULL DEFAULT 0,
  "usedDays" DECIMAL(8,2) NOT NULL DEFAULT 0,
  "pendingDays" DECIMAL(8,2) NOT NULL DEFAULT 0,
  "carriedDays" DECIMAL(8,2) NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LeaveBalance_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LeaveBalance_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "LeaveBalance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "LeaveBalance_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "LeaveType"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "LeaveRequest" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "employeeId" TEXT NOT NULL,
  "leaveTypeId" TEXT NOT NULL,
  "startDate" DATE NOT NULL,
  "endDate" DATE NOT NULL,
  "requestedDays" DECIMAL(8,2) NOT NULL,
  "reason" TEXT,
  "attachmentUrl" TEXT,
  "status" "LeaveRequestStatus" NOT NULL DEFAULT 'PENDING',
  "approvedByUserId" TEXT,
  "approvedAt" TIMESTAMP(3),
  "rejectionReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "LeaveRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "LeaveRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "LeaveRequest_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "LeaveType"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "LeaveRequest_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "LeaveType_organizationId_code_key" ON "LeaveType"("organizationId", "code");
CREATE INDEX "LeaveType_organizationId_idx" ON "LeaveType"("organizationId");
CREATE UNIQUE INDEX "LeaveBalance_employeeId_leaveTypeId_year_key" ON "LeaveBalance"("employeeId", "leaveTypeId", "year");
CREATE INDEX "LeaveBalance_organizationId_year_idx" ON "LeaveBalance"("organizationId", "year");
CREATE INDEX "LeaveBalance_employeeId_year_idx" ON "LeaveBalance"("employeeId", "year");
CREATE INDEX "LeaveRequest_organizationId_status_idx" ON "LeaveRequest"("organizationId", "status");
CREATE INDEX "LeaveRequest_employeeId_startDate_idx" ON "LeaveRequest"("employeeId", "startDate");
CREATE INDEX "LeaveRequest_organizationId_startDate_endDate_idx" ON "LeaveRequest"("organizationId", "startDate", "endDate");
