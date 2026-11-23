import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IconComponent } from './icon.component';

/**
 * Round glass back button. Goes to the previous page in the app; if the page
 * was opened directly (no earlier page in the app), goes to the home page.
 */
@Component({
  selector: 'app-back-button',
  imports: [IconComponent],
  host: { class: 'inline-block shrink-0' },
  template: `
    <button
      type="button"
      class="lg-bubble w-10 h-10 rounded-full grid place-items-center text-white/85 hover:text-white transition-colors"
      aria-label="Back"
      (click)="back()"
    >
      <app-icon name="chevron-left" [size]="20" />
    </button>
  `,
})
export class BackButtonComponent {
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  protected back(): void {
    // Angular numbers each in-app navigation; 1 means this was the first page loaded.
    const navigationId = (history.state as { navigationId?: number } | null)?.navigationId ?? 1;
    if (navigationId > 1) this.location.back();
    else this.router.navigate(['/']);
  }
}
