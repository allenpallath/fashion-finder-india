import { Component, computed, inject, input, signal } from '@angular/core';
import { Product, STORE_COLOURS } from '../../models/product.model';
import { StoreLinkService } from '../../services/store-link.service';
import { WishlistService } from '../../services/wishlist.service';
import { CtaButtonComponent } from '../../shared/cta-button.component';
import { IconComponent } from '../../shared/icon.component';

/**
 * One product as a wide row: photo on the left; title, store, price, rating,
 * a wishlist heart and "View product" on the right. Used on phones and desktop.
 */
@Component({
  selector: 'app-product-card',
  imports: [IconComponent, CtaButtonComponent],
  host: { class: 'block' },
  template: `
    <article class="lg-card lg-rim h-full rounded-[1.75rem] p-2 flex gap-3 sm:gap-4">
      <!-- 3:4 photo frame; the whole photo is shown, with black bars when its shape differs. -->
      <a
        class="relative w-28 sm:w-36 shrink-0 self-start aspect-[3/4] rounded-[1.35rem] overflow-hidden bg-black"
        target="_blank"
        rel="noopener noreferrer"
        tabindex="-1"
        aria-hidden="true"
        [href]="product().productLink"
        (click)="open($event)"
      >
        @if (imageSrc(); as src) {
          <img
            [src]="src"
            alt=""
            class="w-full h-full object-contain"
            loading="lazy"
            decoding="async"
            referrerpolicy="no-referrer"
            (error)="failedImages.set(failedImages() + 1)"
          />
        } @else {
          <span class="w-full h-full flex flex-col items-center justify-center gap-2 text-[11px] text-white/45 bg-white/[0.04]">
            <app-icon name="hanger" [size]="32" [stroke]="1.3" />
            No image
          </span>
        }
      </a>

      <div class="flex flex-col flex-1 min-w-0 py-1 pr-1">
        <div class="flex items-start gap-2">
          <h3 class="flex-1 text-sm sm:text-[15px] font-medium leading-snug line-clamp-2">{{ product().productName }}</h3>
          <button
            type="button"
            class="lg-bubble w-9 h-9 -mt-0.5 rounded-full grid place-items-center shrink-0 transition-colors"
            [class.text-pink-400]="saved()"
            [attr.aria-pressed]="saved()"
            [attr.aria-label]="(saved() ? 'Remove from' : 'Save to') + ' wishlist: ' + product().productName"
            (click)="wishlist.toggle(product())"
          >
            <app-icon name="heart" [size]="17" [filled]="saved()" />
          </button>
        </div>

        <div class="flex items-center gap-2 mt-1.5 text-xs text-white/70">
          <span class="w-2 h-2 rounded-full shrink-0" [style.background]="storeColour()" [style.box-shadow]="'0 0 10px ' + storeColour()"></span>
          <span class="truncate">{{ product().website }}</span>
        </div>

        @if (product().tags.length) {
          <p class="mt-1.5 text-[11px] text-white/45 truncate">{{ product().tags.join(' · ') }}</p>
        }

        <div class="mt-auto pt-3 flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
          <div class="leading-none">
            <span class="text-2xl font-extralight tracking-tight">{{ product().price }}</span>
            @if (product().rating) {
              <span class="block mt-1.5 text-xs text-white/65">
                ★ {{ product().rating }}
                @if (product().reviewCount) {
                  <span class="text-white/45">({{ product().reviewCount }})</span>
                }
              </span>
            }
          </div>
          <a
            appCta
            size="xs"
            target="_blank"
            rel="noopener noreferrer"
            [href]="product().productLink"
            [busy]="opening()"
            [attr.aria-label]="'View ' + product().productName + ' on ' + product().website"
            (click)="open($event)"
          >
            {{ opening() ? 'Opening…' : 'View product' }}
          </a>
        </div>
      </div>
    </article>
  `,
})
export class ProductCardComponent {
  product = input.required<Product>();

  protected readonly wishlist = inject(WishlistService);
  private readonly storeLinks = inject(StoreLinkService);
  protected opening = signal(false);
  protected failedImages = signal(0);

  protected saved = computed(() => this.wishlist.has(this.product()));

  /** Full image first, then the thumbnail; null shows the placeholder. */
  protected imageSrc = computed(() => {
    const { imageUrl, thumbnailUrl } = this.product();
    const sources = [...new Set([imageUrl, thumbnailUrl].filter(Boolean))];
    return sources[this.failedImages()] ?? null;
  });

  protected storeColour = computed(() => STORE_COLOURS[this.product().website] ?? '#a1a1aa');

  /** Opens the store's page. Middle/modifier clicks keep the plain link (the Google Shopping page). */
  protected async open(event: MouseEvent): Promise<void> {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (this.opening()) return;
    this.opening.set(true);
    await this.storeLinks.open(this.product()).finally(() => this.opening.set(false));
  }
}
