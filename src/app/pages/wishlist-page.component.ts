import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BottomBarComponent } from '../components/bottom-bar/bottom-bar.component';
import { ProductListComponent } from '../components/product-list/product-list.component';
import { FashionSearchService } from '../services/fashion-search.service';
import { WishlistService } from '../services/wishlist.service';
import { BackButtonComponent } from '../shared/back-button.component';
import { CtaButtonComponent } from '../shared/cta-button.component';
import { IconComponent } from '../shared/icon.component';

/** "/wishlist": saved products (localStorage), in the same list layout as the results. */
@Component({
  selector: 'app-wishlist-page',
  imports: [BackButtonComponent, BottomBarComponent,ProductListComponent, CtaButtonComponent, IconComponent, RouterLink],
  host: { class: 'block' },
  template: `
    <main class="max-w-6xl mx-auto px-4 pt-6 sm:pt-10 pb-32">
      <header class="mb-5 sm:mb-7 flex items-center gap-3 sm:gap-4">
        <app-back-button />
        <div class="min-w-0">
          <p class="text-sm text-white/50 mb-1">Saved on this device</p>
          <h1 class="text-2xl sm:text-4xl font-medium tracking-tight">
            Your wishlist
            @if (wishlist.count()) {
              <span class="text-white/45 font-extralight">({{ wishlist.count() }})</span>
            }
          </h1>
        </div>
      </header>

      @if (wishlist.count()) {
        <app-product-list [products]="wishlist.products()" />
      } @else {
        <div class="max-w-md mx-auto text-center py-16">
          <span class="lg-bubble w-16 h-16 rounded-full grid place-items-center mx-auto mb-5">
            <app-icon name="heart" [size]="28" [stroke]="1.5" />
          </span>
          <p class="text-sm text-white/70">Nothing saved yet. Tap the heart on any product to keep it here.</p>
        </div>
      }
    </main>

    <app-bottom-bar>
      @if (search.hasResults()) {
        <a routerLink="/results" appCta icon="list" size="xs">
          <span class="sm:hidden">Results</span><span class="hidden sm:inline">Back to results</span>
        </a>
      }
      <a routerLink="/" appCta icon="search" size="xs">New search</a>
    </app-bottom-bar>
  `,
})
export class WishlistPageComponent {
  protected readonly wishlist = inject(WishlistService);
  protected readonly search = inject(FashionSearchService);
}
