import { AfterViewInit, CUSTOM_ELEMENTS_SCHEMA, Component, ElementRef, computed, effect, input, output, signal, viewChild } from '@angular/core';
import { register as registerSwiper } from 'swiper/element/bundle';
import { Product } from '../../models/product.model';
import { CtaButtonComponent } from '../../shared/cta-button.component';
import { IconButtonComponent } from '../../shared/icon-button.component';
import { ProductCardComponent } from '../product-card/product-card.component';

// Defines <swiper-container>/<swiper-slide>. Done here, not in main.ts, so Swiper
// is only downloaded with the lazy-loaded results chunk.
registerSwiper();

/** The <swiper-container> element once Swiper has initialised it. */
type SwiperElement = HTMLElement & { swiper?: { activeIndex: number; update(): void }; initialize(): void };

/** Swipeable row of product cards with arrow buttons, a counter and a "more results" button. */
@Component({
  selector: 'app-results-carousel',
  imports: [ProductCardComponent, IconButtonComponent, CtaButtonComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'block py-2' },
  template: `
    <div class="flex items-center justify-end flex-wrap gap-2 mb-2">
      <button #prev type="button" appIconButton icon="chevron-left" aria-label="Previous results"></button>
      <button #next type="button" appIconButton icon="chevron-right" aria-label="Next results"></button>
      <span class="lg-bubble h-10 rounded-full px-4 inline-flex items-center text-sm text-white/80 tabular-nums">
        {{ index() + 1 }} / {{ products().length }}
      </span>
      <button type="button" appCta icon="search" size="xs" (click)="searchAgain.emit()">Search again</button>
    </div>

    <swiper-container #swiper init="false" class="block -mx-6 px-6">
      @for (product of products(); track product.id) {
        <swiper-slide class="!h-auto pt-3 pb-6">
          <app-product-card [product]="product" />
        </swiper-slide>
      }
    </swiper-container>

    @if (canLoadMore()) {
      <div class="flex justify-center mt-3">
        <button type="button" appCta icon="plus" size="sm" class="max-w-xs" [busy]="loadingMore()" [disabled]="loadingMore()" (click)="loadMore.emit()">
          {{ moreLabel() }}
        </button>
      </div>
    }
  `,
  styles: `
    swiper-slide {
      width: min(260px, 78vw);
      display: flex;
    }
    .swiper-button-disabled {
      opacity: 0.35;
      pointer-events: none;
    }
  `,
})
export class ResultsCarouselComponent implements AfterViewInit {
  products = input.required<Product[]>();
  loadingMore = input(false);
  canLoadMore = input(true);
  /** The next click runs a new search (all loaded items are already shown). */
  moreUsesSearch = input(false);
  searchAgain = output<void>();
  loadMore = output<void>();

  protected index = signal(0);
  protected moreLabel = computed(() =>
    this.loadingMore() ? 'Finding more…' : this.moreUsesSearch() ? 'Find more results' : 'Show more results'
  );

  private readonly swiper = viewChild.required<ElementRef<SwiperElement>>('swiper');
  private readonly prev = viewChild.required('prev', { read: ElementRef });
  private readonly next = viewChild.required('next', { read: ElementRef });

  constructor() {
    // New slides from "Show more" need Swiper to re-measure after they render.
    effect(() => {
      this.products();
      setTimeout(() => this.swiper().nativeElement.swiper?.update());
    });
  }

  ngAfterViewInit(): void {
    const el = this.swiper().nativeElement;
    Object.assign(el, {
      slidesPerView: 'auto',
      spaceBetween: 20,
      speed: 450,
      resistanceRatio: 0.6,
      grabCursor: true,
      keyboard: { enabled: true },
      navigation: { prevEl: this.prev().nativeElement, nextEl: this.next().nativeElement },
      a11y: { prevSlideMessage: 'Previous results', nextSlideMessage: 'Next results' },
      pagination: { clickable: true, dynamicBullets: true },
      // Pagination lives in Swiper's shadow DOM, so its styles are injected.
      injectStyles: ['.swiper-pagination-bullet { background: #fff; opacity: .25 } .swiper-pagination-bullet-active { opacity: 1 }'],
    });
    el.initialize();
    el.addEventListener('swiperslidechange', () => this.index.set(el.swiper?.activeIndex ?? 0));
  }
}
