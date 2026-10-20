import { Request } from 'express';
import { PRIORITIES, STATUSES } from '../reports/report.schemas';

export type Role = 'USER' | 'TECHNICIAN';
export type Status = (typeof STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number];

export interface AuthUser {
  id: string;
  organizationId: string;
  role: Role;
  name: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}
