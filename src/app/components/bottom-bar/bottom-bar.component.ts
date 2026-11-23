import { Component } from '@angular/core';

/**
 * Glass action bar fixed to the bottom of the screen; its buttons are projected.
 * Pages using it need bottom padding (pb-32) so the last item isn't hidden.
 */
@Component({
  selector: 'app-bottom-bar',
  host: {
    class: 'fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pointer-events-none',
  },
  template: `
    <!-- No liquidGlass refraction: the list scrolls under it, so it would be redrawn constantly. -->
    <nav class="lg-panel lg-rim pointer-events-auto mx-auto w-fit max-w-full rounded-full p-1.5 flex items-center gap-1.5 sm:gap-2">
      <ng-content />
    </nav>
  `,
})
export class BottomBarComponent {}
