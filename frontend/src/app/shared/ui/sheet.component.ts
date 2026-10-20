import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  input,
  output,
  viewChild
} from '@angular/core';
import { IconComponent } from './icon.component';

/**
 * Hoja lateral (escritorio) o inferior (móvil) construida sobre `<dialog>` nativo:
 * el navegador aporta foco atrapado, cierre con Esc, fondo inerte y rol de diálogo accesible.
 */
@Component({
  selector: 'app-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    <dialog
      #dialog
      [class]="'sheet sheet-' + variant()"
      [attr.aria-labelledby]="titleId"
      (close)="closed.emit()"
      (click)="onBackdropClick($event)"
    >
      <div class="sheet-panel">
        <header class="sheet-header">
          <div class="sheet-heading">
            @if (eyebrow()) {
              <p class="sheet-eyebrow">{{ eyebrow() }}</p>
            }
            <h2 [id]="titleId">{{ heading() }}</h2>
          </div>
          <button type="button" class="btn btn-ghost btn-icon" (click)="dialog.close()" aria-label="Cerrar">
            <app-icon name="x" />
          </button>
        </header>
        <div class="sheet-body">
          <ng-content />
        </div>
        <ng-content select="[sheet-footer]" />
      </div>
    </dialog>
  `,
  styles: `
    .sheet {
      padding: 0;
      border: 0;
      background: transparent;
      color: var(--text);
      max-width: 100vw;
      max-height: 100dvh;
      overflow: visible;
    }
    .sheet::backdrop {
      background: var(--overlay);
      backdrop-filter: blur(2px);
    }
    .sheet[open] {
      animation: fade 160ms var(--ease);
    }
    .sheet-panel {
      display: flex;
      flex-direction: column;
      background: var(--surface);
      box-shadow: var(--shadow-lg);
      overflow: hidden;
    }
    .sheet-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      padding: 20px 20px 12px;
    }
    .sheet-eyebrow {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-3);
      margin-bottom: 4px;
    }
    .sheet-heading h2 {
      font-size: 19px;
      font-weight: 650;
    }
    .sheet-body {
      flex: 1;
      overflow-y: auto;
      overscroll-behavior: contain;
      padding: 8px 20px 24px;
    }

    /* Móvil: hoja inferior */
    .sheet {
      margin: auto 0 0;
      width: 100vw;
    }
    .sheet-panel {
      max-height: 92dvh;
      border-radius: var(--r-xl) var(--r-xl) 0 0;
      padding-bottom: env(safe-area-inset-bottom);
    }
    .sheet[open] .sheet-panel {
      animation: slide-up 260ms var(--ease);
    }
    .sheet-panel::before {
      content: '';
      align-self: center;
      width: 40px;
      height: 4px;
      margin-top: 8px;
      border-radius: 4px;
      background: var(--border-strong);
    }

    @media (min-width: 768px) {
      .sheet-side {
        margin: 0 0 0 auto;
        width: min(520px, 100vw);
        height: 100dvh;
      }
      .sheet-side .sheet-panel {
        height: 100%;
        max-height: none;
        border-radius: 0;
        border-left: 1px solid var(--border);
      }
      .sheet-side[open] .sheet-panel {
        animation: slide-left 240ms var(--ease);
      }
      .sheet-center {
        margin: auto;
        width: min(480px, calc(100vw - 32px));
      }
      .sheet-center .sheet-panel {
        border-radius: var(--r-xl);
        border: 1px solid var(--border);
      }
      .sheet-center[open] .sheet-panel {
        animation: pop 200ms var(--ease);
      }
      .sheet-panel::before {
        display: none;
      }
    }

    @keyframes fade {
      from { opacity: 0; }
    }
    @keyframes slide-up {
      from { transform: translateY(40px); opacity: 0.6; }
    }
    @keyframes slide-left {
      from { transform: translateX(32px); opacity: 0.6; }
    }
    @keyframes pop {
      from { transform: scale(0.97); opacity: 0; }
    }
  `
})
export class SheetComponent {
  readonly open = input(false);
  readonly heading = input.required<string>();
  readonly eyebrow = input('');
  readonly variant = input<'side' | 'center'>('side');
  readonly closed = output<void>();

  private static nextId = 0;
  protected readonly titleId = `sheet-title-${SheetComponent.nextId++}`;
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const dialog = this.dialog().nativeElement;
      if (this.open() && !dialog.open) dialog.showModal();
      if (!this.open() && dialog.open) dialog.close();
    });
  }

  /** Un clic fuera del panel (sobre el backdrop) cierra la hoja. */
  protected onBackdropClick(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) this.dialog().nativeElement.close();
  }
}
