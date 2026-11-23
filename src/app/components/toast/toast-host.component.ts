import { Component, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';
import { IconButtonComponent } from '../../shared/icon-button.component';
import { IconComponent } from '../../shared/icon.component';

/** Renders ToastService messages as glass toasts at the bottom centre, above the pages' bottom bar. */
@Component({
  selector: 'app-toast-host',
  imports: [IconComponent, IconButtonComponent],
  host: {
    class: 'fixed inset-x-0 bottom-0 z-[200] flex flex-col items-center gap-2 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pointer-events-none',
  },
  template: `
    @for (toast of toasts.toasts(); track toast.id) {
      <div
        class="lg-panel lg-rim pointer-events-auto w-full max-w-md rounded-[1.6rem] p-2 flex items-center gap-3"
        animate.enter="lg-toast-enter"
        animate.leave="lg-toast-leave"
        [attr.role]="toast.kind === 'error' ? 'alert' : 'status'"
      >
        <span class="lg-bubble w-10 h-10 rounded-full grid place-items-center shrink-0" [class]="toast.kind === 'error' ? '!text-rose-300' : '!text-cyan-200'">
          <app-icon [name]="toast.kind === 'error' ? 'warning' : 'info'" [size]="20" [stroke]="1.8" />
        </span>
        <p class="flex-1 min-w-0 text-sm text-white/90 leading-snug break-words">{{ toast.message }}</p>
        <button type="button" appIconButton icon="close" [size]="32" aria-label="Dismiss" (click)="toasts.dismiss(toast.id)"></button>
      </div>
    }
  `,
})
export class ToastHostComponent {
  protected readonly toasts = inject(ToastService);
}
