import { Injectable, signal } from '@angular/core';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  readonly user = signal<User | null>(this.readUser());

  setSession(token: string, user: User): void {
    localStorage.setItem('nexo_token', token);
    localStorage.setItem('nexo_user', JSON.stringify(user));
    this.user.set(user);
  }

  clearSession(): void {
    localStorage.removeItem('nexo_token');
    localStorage.removeItem('nexo_user');
    this.user.set(null);
  }

  token(): string | null {
    return localStorage.getItem('nexo_token');
  }

  isAuthenticated(): boolean {
    return Boolean(this.token() && this.user());
  }

  private readUser(): User | null {
    const raw = localStorage.getItem('nexo_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }
}
