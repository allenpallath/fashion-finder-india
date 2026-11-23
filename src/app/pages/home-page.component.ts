import { Component, afterNextRender, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SearchFormComponent } from '../components/search-form/search-form.component';
import { WishlistLinkComponent } from '../components/wishlist-link/wishlist-link.component';
import { SearchFormData } from '../models/search-form.model';
import { FashionSearchService } from '../services/fashion-search.service';
import { CtaButtonComponent } from '../shared/cta-button.component';

/** "/": hero and search form. Submitting starts the search and opens /results. */
@Component({
  selector: 'app-home-page',
  imports: [SearchFormComponent, WishlistLinkComponent, CtaButtonComponent, RouterLink],
  host: { class: 'flex flex-col min-h-dvh' },
  template: `
    <main class="flex-1 flex flex-col justify-center">
      <div class="w-full max-w-6xl mx-auto px-4 pt-6 flex items-start justify-between gap-4">
        <h1 class="text-[1.9rem] leading-[1.1] sm:text-5xl font-semibold tracking-tight">Search and find your fashion easily</h1>
        <app-wishlist-link class="mt-1" />
      </div>

      <app-search-form [initial]="search.lastForm()" (searchSubmit)="onSearch($event)" />

      @if (search.hasResults()) {
        <div class="flex justify-center -mt-2 pb-6">
          <a routerLink="/results" appCta icon="list" size="xs">View last results ({{ search.products().length }})</a>
        </div>
      }
    </main>

    <footer class="px-4 pb-4 pt-2 text-center">
      <p class="text-xs text-white/40">Results from Google Shopping · prices and stock may change on the store</p>
      <p class="text-[11px] text-white/25 mt-1">FashionFinder India · {{ year }}</p>
    </footer>
  `,
})
export class HomePageComponent {
  protected readonly search = inject(FashionSearchService);
  private readonly router = inject(Router);
  protected readonly year = new Date().getFullYear();

  constructor() {
    // "Search again" on the results page comes back here and puts the cursor in the form.
    afterNextRender(() => {
      if (history.state?.focusForm) document.getElementById('dressType')?.focus();
    });
  }

  protected onSearch(form: SearchFormData): void {
    this.router.navigate(['/results']);
    // Errors already show a toast, so go back to the form instead of an empty page.
    this.search.search(form).subscribe(() => {
      if (this.search.state() === 'error') this.router.navigate(['/']);
    });
  }
}
