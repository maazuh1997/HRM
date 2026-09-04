export type LeaveBalance = {
  allocatedDays: number;
  carriedDays: number;
  usedDays: number;
  pendingDays: number;
};

export function getAvailableLeaveDays(balance: LeaveBalance): number {
  return Math.max(0, balance.allocatedDays + balance.carriedDays - balance.usedDays - balance.pendingDays);
}

export function validateLeaveRequest(balance: LeaveBalance, requestedDays: number): void {
  if (!Number.isFinite(requestedDays) || requestedDays <= 0) throw new Error('Requested leave days must be greater than zero');
  if (requestedDays > getAvailableLeaveDays(balance)) throw new Error('Insufficient leave balance');
}
