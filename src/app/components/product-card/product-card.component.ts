import { Component, computed, inject, input, signal } from '@angular/core';
import { Product, STORE_COLOURS } from '../../models/product.model';
import { StoreLinkService } from '../../services/store-link.service';
import { CtaButtonComponent } from '../../shared/cta-button.component';
import { IconButtonComponent } from '../../shared/icon-button.component';
import { IconComponent } from '../../shared/icon.component';

/** One search result: image, title, price, rating, store and a "View product" button. */
@Component({
  selector: 'app-product-card',
  imports: [IconComponent, IconButtonComponent, CtaButtonComponent],
  host: { class: 'block w-full' },
  template: `
    <article class="lg-card lg-rim w-full max-w-[290px] rounded-[2rem] p-2 flex flex-col h-full group">
      <!-- 3:4 portrait frame; the whole photo is shown, with black bars when its shape differs. -->
      <div class="relative aspect-[3/4] rounded-[1.6rem] overflow-hidden bg-black">
        @if (imageSrc(); as src) {
          <img
            [src]="src"
            [alt]="product().productName"
            class="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
            decoding="async"
            referrerpolicy="no-referrer"
            (error)="failedImages.set(failedImages() + 1)"
          />
        } @else {
          <div class="w-full h-full flex flex-col items-center justify-center gap-2 text-xs text-white/45 bg-white/[0.04]">
            <app-icon name="hanger" [size]="40" [stroke]="1.3" />
            Image unavailable
          </div>
        }
        <div class="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/25"></div>

        <div class="absolute top-3 left-3 flex flex-col items-start gap-1.5">
          @for (tag of product().tags; track tag) {
            <span class="lg-bubble rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider">{{ tag }}</span>
          }
        </div>

        <a
          appIconButton
          icon="external"
          [size]="36"
          class="absolute top-3 right-3"
          target="_blank"
          rel="noopener noreferrer"
          [href]="product().productLink"
          [attr.aria-label]="'Open ' + product().productName + ' on ' + product().website"
          (click)="open($event)"
        ></a>
      </div>

      <div class="px-2.5 pt-3 pb-1.5 flex flex-col flex-1">
        <h3 class="text-sm font-medium leading-snug line-clamp-2 min-h-[2.4rem]">{{ product().productName }}</h3>

        <div class="flex items-end justify-between mt-2.5 leading-none">
          <span class="text-[1.6rem] font-extralight tracking-tight">{{ product().price }}</span>
          @if (product().rating) {
            <span class="text-right">
              <span class="text-xl font-extralight">{{ product().rating }}</span>
              <span class="block text-[11px] text-white/65 mt-1.5">{{ product().reviewCount || 'rating' }}</span>
            </span>
          }
        </div>

        @if (ratingPosition(); as left) {
          <div class="lg-meter mt-2" aria-hidden="true">
            <span class="lg-bubble lg-meter__pill" [style.left.%]="left">★ {{ product().rating }}</span>
          </div>
        }

        <div class="flex items-center gap-2 mt-2 mb-3 text-xs text-white/80">
          <span class="w-2 h-2 rounded-full" [style.background]="storeColour()" [style.box-shadow]="'0 0 10px ' + storeColour()"></span>
          {{ product().website }}
        </div>

        <a
          appCta
          size="sm"
          class="mt-auto"
          target="_blank"
          rel="noopener noreferrer"
          [href]="product().productLink"
          [busy]="opening()"
          (click)="open($event)"
        >
          {{ opening() ? 'Opening store…' : 'View product' }}
        </a>
      </div>
    </article>
  `,
})
export class ProductCardComponent {
  product = input.required<Product>();

  private readonly storeLinks = inject(StoreLinkService);
  protected opening = signal(false);
  protected failedImages = signal(0);

  /** Full image first, then the thumbnail; null shows the placeholder. */
  protected imageSrc = computed(() => {
    const { imageUrl, thumbnailUrl } = this.product();
    const sources = [...new Set([imageUrl, thumbnailUrl].filter(Boolean))];
    return sources[this.failedImages()] ?? null;
  });

  protected storeColour = computed(() => STORE_COLOURS[this.product().website] ?? '#a1a1aa');

  /** Rating pill position on a 1–5 scale, kept inside the track (14–86%). */
  protected ratingPosition = computed(() => {
    const rating = parseFloat(this.product().rating);
    if (!rating) return null;
    const pct = ((Math.min(Math.max(rating, 1), 5) - 1) / 4) * 100;
    return Math.min(Math.max(pct, 14), 86);
  });

  /** Opens the store's page. Middle/modifier clicks keep the plain link (the Google Shopping page). */
  protected async open(event: MouseEvent): Promise<void> {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (this.opening()) return;
    this.opening.set(true);
    await this.storeLinks.open(this.product()).finally(() => this.opening.set(false));
  }
}
