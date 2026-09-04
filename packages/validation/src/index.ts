import { z } from 'zod';

export const organizationSlugSchema = z
  .string()
  .trim()
  .min(2)
  .max(63)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const emailSchema = z.string().trim().toLowerCase().email().max(320);

export { z };
