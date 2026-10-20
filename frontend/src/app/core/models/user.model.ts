export type UserRole = 'USER' | 'TECHNICIAN';

export interface User {
  id: string;
  organizationId: string;
  organizationSlug: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface SessionResponse {
  user: User;
}

export interface LoginRequest {
  organizationSlug: string;
  email: string;
  password: string;
}
