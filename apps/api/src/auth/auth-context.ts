import type { Request } from 'express';
import type { SessionContext } from '@hrm/auth';

export const SESSION_COOKIE = 'hrm_session';

export type AuthenticatedRequest = Request & {
  auth?: SessionContext;
};
