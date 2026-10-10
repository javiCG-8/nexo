import { Request } from 'express';

export type Role = 'USER' | 'TECHNICIAN';
export type Status = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

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
