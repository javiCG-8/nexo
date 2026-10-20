import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  tone: 'success' | 'error' | 'info';
}

export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel: string;
  tone: 'danger' | 'default';
  resolve: (accepted: boolean) => void;
}

/** Notificaciones efímeras y confirmaciones modales, sin `alert()`/`confirm()` del navegador. */
@Injectable({ providedIn: 'root' })
export class FeedbackService {
  readonly toasts = signal<Toast[]>([]);
  readonly confirmation = signal<ConfirmRequest | null>(null);
  private nextId = 0;

  toast(message: string, tone: Toast['tone'] = 'success'): void {
    const id = this.nextId++;
    this.toasts.update(list => [...list.slice(-2), { id, message, tone }]);
    setTimeout(() => this.dismiss(id), tone === 'error' ? 6000 : 3500);
  }

  dismiss(id: number): void {
    this.toasts.update(list => list.filter(toast => toast.id !== id));
  }

  confirm(options: Omit<ConfirmRequest, 'resolve' | 'tone'> & { tone?: ConfirmRequest['tone'] }): Promise<boolean> {
    return new Promise(resolve => {
      this.confirmation.set({ tone: 'default', ...options, resolve });
    });
  }

  settle(accepted: boolean): void {
    this.confirmation()?.resolve(accepted);
    this.confirmation.set(null);
  }
}
