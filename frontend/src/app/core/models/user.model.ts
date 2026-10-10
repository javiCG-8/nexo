export type UserRole = 'USER' | 'TECHNICIAN';

export interface User {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  role: UserRole;
  organizationSlug?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}
