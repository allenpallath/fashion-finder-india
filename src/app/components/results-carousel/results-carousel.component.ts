import { AfterViewInit, CUSTOM_ELEMENTS_SCHEMA, Component, ElementRef, effect, input, output, signal, untracked, viewChild } from '@angular/core';
import { register as registerSwiper } from 'swiper/element/bundle';
import { Product } from '../../models/product.model';
import { CtaButtonComponent } from '../../shared/cta-button.component';
import { IconButtonComponent } from '../../shared/icon-button.component';
import { ProductCardComponent } from '../product-card/product-card.component';

// Defines <swiper-container>/<swiper-slide>. Done here, not in main.ts, so Swiper
// is only downloaded with the lazy-loaded results chunk.
registerSwiper();

/** The <swiper-container> element once Swiper has initialised it. */
type SwiperElement = HTMLElement & {
  swiper?: { activeIndex: number; isEnd: boolean; update(): void; navigation: { update(): void } };
  initialize(): void;
};

/** Swipeable row of product cards with arrow buttons, a counter and a "Find more results" button. */
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
        {{ atEnd() ? products().length : index() + 1 }} / {{ products().length }}
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
          {{ loadingMore() ? 'Finding more…' : 'Find more results' }}
        </button>
      </div>
    }
  `,
  styles: `
    swiper-slide {
      width: min(290px, 80vw);
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
  searchAgain = output<void>();
  loadMore = output<void>();

  protected index = signal(0);
  /** At the end several cards are visible, so the counter shows the last one. */
  protected atEnd = signal(false);

  private readonly swiper = viewChild.required<ElementRef<SwiperElement>>('swiper');
  private readonly prev = viewChild.required('prev', { read: ElementRef });
  private readonly next = viewChild.required('next', { read: ElementRef });

  constructor() {
    // Cards appended by "Find more" need Swiper to re-measure once they render.
    // When the user is at the end, Swiper's update() snaps to the new last card;
    // clearing isEnd before the cards render keeps the carousel where it was.
    effect(() => {
      this.products();
      const el = untracked(this.swiper).nativeElement;
      if (el.swiper) el.swiper.isEnd = false;
      setTimeout(() => {
        el.swiper?.update();
        // isEnd was cleared by hand, so Swiper fires no "left the end" event; re-enable the arrows here.
        el.swiper?.navigation.update();
        this.syncCounter(el);
      });
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
    for (const event of ['swiperslidechange', 'swiperreachend', 'swiperfromedge']) {
      el.addEventListener(event, () => this.syncCounter(el));
    }
  }

  private syncCounter(el: SwiperElement): void {
    this.index.set(el.swiper?.activeIndex ?? 0);
    this.atEnd.set(el.swiper?.isEnd ?? false);
  }
}
