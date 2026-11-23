import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BottomBarComponent } from '../components/bottom-bar/bottom-bar.component';
import { LoaderComponent } from '../components/loader/loader.component';
import { ProductListComponent } from '../components/product-list/product-list.component';
import { WishlistLinkComponent } from '../components/wishlist-link/wishlist-link.component';
import { MAX_BUDGET, formatBudget } from '../models/search-form.model';
import { FashionSearchService } from '../services/fashion-search.service';
import { CtaButtonComponent } from '../shared/cta-button.component';
import { IconComponent } from '../shared/icon.component';

/** "/results": the current search as a list, with Search again / Find more / Wishlist in a bottom bar. */
@Component({
  selector: 'app-results-page',
  imports: [BottomBarComponent, LoaderComponent, ProductListComponent, WishlistLinkComponent, CtaButtonComponent, IconComponent],
  host: { class: 'block' },
  template: `
    <main class="max-w-6xl mx-auto px-4 pt-6 sm:pt-10 pb-32">
      <header class="mb-5 sm:mb-7">
        @if (summary(); as text) {
          <p class="text-sm text-white/50 mb-1 truncate">{{ text }}</p>
        }
        <h1 class="text-2xl sm:text-4xl font-medium tracking-tight">{{ title() }}</h1>
      </header>

      @switch (view()) {
        @case ('loading') {
          <app-loader />
        }
        @case ('results') {
          <app-product-list [products]="search.products()" />
        }
        @case ('empty') {
          <div class="max-w-md mx-auto text-center py-16">
            <span class="lg-bubble w-16 h-16 rounded-full grid place-items-center mx-auto mb-5">
              <app-icon name="search" [size]="28" [stroke]="1.5" />
            </span>
            <p class="text-sm text-white/70">Try different filters or a broader dress type.</p>
          </div>
        }
      }
    </main>

    <app-bottom-bar>
      <button type="button" appCta icon="search" size="xs" (click)="searchAgain()">
        <span class="sm:hidden">Search</span><span class="hidden sm:inline">Search again</span>
      </button>
      @if (view() === 'results' && search.canLoadMore()) {
        <button type="button" appCta icon="plus" size="xs" [busy]="search.loadingMore()" [disabled]="search.loadingMore()" (click)="search.loadMore().subscribe()">
          {{ search.loadingMore() ? 'Finding…' : 'Find more' }}
        </button>
      }
      <app-wishlist-link />
    </app-bottom-bar>
  `,
})
export class ResultsPageComponent {
  protected readonly search = inject(FashionSearchService);
  private readonly router = inject(Router);

  protected readonly view = computed(() =>
    this.search.state() === 'loading' ? 'loading' : this.search.hasResults() ? 'results' : 'empty'
  );

  protected readonly title = computed(() => {
    switch (this.view()) {
      case 'loading':
        return 'Searching…';
      case 'results':
        return `${this.search.products().length} picks for you`;
      default:
        return 'No matching dresses';
    }
  });

  /** "Women · Kurta · black · under ₹2,000" */
  protected readonly summary = computed(() => {
    const form = this.search.lastForm();
    if (!form) return '';
    const budget = form.budgetRange < MAX_BUDGET ? `under ${formatBudget(form.budgetRange)}` : '';
    return [form.gender, form.dressType, form.colour, ...form.styles, ...form.occasions, budget].filter(Boolean).join(' · ');
  });

  constructor() {
    // Nothing searched in this tab (e.g. /results opened directly): start at the form.
    if (this.search.state() === 'idle') this.router.navigate(['/'], { replaceUrl: true });
  }

  /** Back to the form (still filled in) with the cursor in the dress type field. */
  protected searchAgain(): void {
    this.router.navigate(['/'], { state: { focusForm: true } });
  }
}
