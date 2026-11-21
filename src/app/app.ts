import { Component, computed, inject, signal } from '@angular/core';
import { LoaderComponent } from './components/loader/loader.component';
import { ResultsCarouselComponent } from './components/results-carousel/results-carousel.component';
import { ResultsModalComponent } from './components/results-modal/results-modal.component';
import { SearchFormComponent } from './components/search-form/search-form.component';
import { ToastHostComponent } from './components/toast/toast-host.component';
import { WavesBackgroundComponent } from './components/waves-background/waves-background.component';
import { SearchFormData } from './models/search-form.model';
import { FashionSearchService } from './services/fashion-search.service';
import { CtaButtonComponent } from './shared/cta-button.component';
import { IconComponent } from './shared/icon.component';

/** Page shell: hero + search form, and the results popup (lazy-loaded with @defer). */
@Component({
  selector: 'app-root',
  imports: [
    WavesBackgroundComponent,
    SearchFormComponent,
    ResultsModalComponent,
    ResultsCarouselComponent,
    LoaderComponent,
    ToastHostComponent,
    CtaButtonComponent,
    IconComponent,
  ],
  host: { class: 'flex flex-col min-h-dvh' },
  template: `
    <app-waves-background />

    <!-- Hidden behind the popup so the page's glass isn't redrawn while the carousel moves. -->
    <main class="flex-1 flex flex-col justify-center" [class.invisible]="resultsOpen()">
      <h1 class="w-full max-w-6xl mx-auto px-4 pt-6 text-[1.9rem] leading-[1.1] sm:text-5xl font-semibold tracking-tight">
        Search and find your fashion easily
      </h1>

      <app-search-form (searchSubmit)="onSearch($event)" />

      @if (!resultsOpen() && search.hasResults()) {
        <div class="flex justify-center -mt-2 pb-6">
          <button type="button" appCta icon="list" size="xs" (click)="resultsOpen.set(true)">
            View last results ({{ search.products().length }})
          </button>
        </div>
      }
    </main>

    @if (resultsOpen()) {
      <!-- The popup, carousel and Swiper live in their own chunk, fetched while the browser is idle. -->
      @defer (prefetch on idle) {
        <app-results-modal animate.enter="lg-modal-enter" animate.leave="lg-modal-leave" [title]="title()" (closed)="resultsOpen.set(false)">
          @switch (view()) {
            @case ('loading') {
              <app-loader />
            }
            @case ('results') {
              <app-results-carousel
                [products]="search.products()"
                [loadingMore]="search.loadingMore()"
                [canLoadMore]="search.canLoadMore()"
                [moreUsesSearch]="search.moreUsesSearch()"
                (searchAgain)="backToForm()"
                (loadMore)="search.loadMore().subscribe()"
              />
            }
            @case ('empty') {
              <div class="max-w-md mx-auto text-center py-12">
                <span class="lg-bubble w-16 h-16 rounded-full grid place-items-center mx-auto mb-5">
                  <app-icon name="search" [size]="28" [stroke]="1.5" />
                </span>
                <p class="text-sm text-white/70 mb-6">Try different filters or a broader dress type.</p>
                <button type="button" appCta size="sm" class="max-w-xs mx-auto" (click)="backToForm()">Change filters</button>
              </div>
            }
          }
        </app-results-modal>
      }
    }

    <app-toast-host />

    <footer class="px-4 pb-4 pt-2 text-center" [class.invisible]="resultsOpen()">
      <p class="text-xs text-white/40">Results from Google Shopping · prices and stock may change on the store</p>
      <p class="text-[11px] text-white/25 mt-1">FashionFinder India · {{ year }}</p>
    </footer>
  `,
})
export class App {
  protected readonly search = inject(FashionSearchService);
  protected readonly year = new Date().getFullYear();
  protected readonly resultsOpen = signal(false);

  /** What the popup shows. */
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

  protected onSearch(form: SearchFormData): void {
    this.resultsOpen.set(true);
    // Errors already show a toast, so close the popup instead of showing the empty state.
    this.search.search(form).subscribe(() => {
      if (this.search.state() === 'error') this.resultsOpen.set(false);
    });
  }

  /** Closes the popup and puts the cursor back in the dress type field. */
  protected backToForm(): void {
    this.resultsOpen.set(false);
    setTimeout(() => document.getElementById('dressType')?.focus(), 220);
  }
}
