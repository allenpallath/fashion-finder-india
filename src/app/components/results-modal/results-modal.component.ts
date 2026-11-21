import { AfterViewInit, Component, ElementRef, OnDestroy, input, output, viewChild } from '@angular/core';
import { IconButtonComponent } from '../../shared/icon-button.component';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Popup for search results (a bottom sheet on phones). Closes on ✕, Escape or a
 * backdrop click; locks page scroll and keeps keyboard focus inside while open.
 */
@Component({
  selector: 'app-results-modal',
  imports: [IconButtonComponent],
  host: {
    class: 'fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6',
    '(document:keydown)': 'onKeydown($event)',
  },
  template: `
    <div class="lg-modal-scrim absolute inset-0 bg-[#020b12]/60 backdrop-blur-[6px]" (click)="closed.emit()"></div>

    <!-- No liquidGlass refraction: the carousel moves over this panel, so it would be redrawn every frame. -->
    <section
      #dialog
      role="dialog"
      aria-modal="true"
      aria-labelledby="results-title"
      tabindex="-1"
      class="lg-modal-dialog lg-panel lg-rim relative w-full max-w-6xl max-h-[94dvh] sm:max-h-[92dvh] rounded-t-[2rem] sm:rounded-[2.5rem] flex flex-col overflow-hidden outline-none"
    >
      <span class="sm:hidden mx-auto mt-2.5 h-1 w-10 rounded-full bg-white/30 shrink-0" aria-hidden="true"></span>
      <header class="flex items-center justify-between gap-4 px-5 sm:px-8 pt-3 sm:pt-5 pb-1 shrink-0">
        <h2 id="results-title" class="text-xl sm:text-3xl font-medium tracking-tight">{{ title() }}</h2>
        <button type="button" appIconButton icon="close" [size]="44" aria-label="Close results" (click)="closed.emit()"></button>
      </header>
      <div class="overflow-y-auto overflow-x-hidden min-h-0 px-5 sm:px-8 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:pb-5">
        <ng-content />
      </div>
    </section>
  `,
})
export class ResultsModalComponent implements AfterViewInit, OnDestroy {
  title = input('Results');
  closed = output<void>();

  private readonly dialog = viewChild.required<ElementRef<HTMLElement>>('dialog');
  private previousFocus: HTMLElement | null = null;

  ngAfterViewInit(): void {
    this.previousFocus = document.activeElement as HTMLElement | null;
    document.documentElement.style.overflow = 'hidden';
    this.dialog().nativeElement.focus();
  }

  ngOnDestroy(): void {
    document.documentElement.style.overflow = '';
    this.previousFocus?.focus();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') this.closed.emit();
    if (event.key === 'Tab') this.trapFocus(event);
  }

  /** Wraps Tab / Shift+Tab around the dialog's first and last focusable elements. */
  private trapFocus(event: KeyboardEvent): void {
    const dialog = this.dialog().nativeElement;
    const items = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent);
    const first = items[0] ?? dialog;
    const last = items[items.length - 1] ?? dialog;
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === dialog)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
