import { Component } from '@angular/core';
import { LiquidGlassDirective } from '../../shared/liquid-glass.directive';

/** Loading state for the results page: a status pill and skeleton rows. */
@Component({
  selector: 'app-loader',
  imports: [LiquidGlassDirective],
  host: { class: 'block' },
  template: `
    <div liquidGlass class="lg-panel lg-rim rounded-full max-w-xl mx-auto pl-2 pr-6 py-2 flex items-center gap-4 mb-6">
      <span class="lg-cta__knob w-12 h-12"><span class="lg-spinner"></span></span>
      <span class="flex-1 min-w-0">
        <span class="block text-sm font-medium truncate">Searching across all the shopping sites…</span>
        <span class="block text-xs text-white/45">Searching Google Shopping · usually a few seconds</span>
      </span>
      <span class="lg-dots lg-dots--busy hidden sm:flex"><i></i><i></i><i></i></span>
    </div>

    <!-- Skeleton rows shaped like the product cards (two columns on large screens). -->
    <div class="grid gap-3 sm:gap-4 lg:grid-cols-2">
      @for (row of [1, 2, 3, 4]; track row) {
        <div class="lg-card lg-rim rounded-[1.75rem] p-2 flex gap-3 sm:gap-4">
          <div class="w-28 sm:w-36 aspect-[3/4] rounded-[1.35rem] shimmer shrink-0"></div>
          <div class="flex-1 py-2 pr-2 space-y-3">
            <div class="h-3 w-4/5 rounded-full shimmer"></div>
            <div class="h-3 w-1/2 rounded-full shimmer"></div>
            <div class="h-7 w-2/5 rounded-full shimmer mt-6"></div>
            <div class="h-10 w-36 rounded-full shimmer"></div>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .shimmer {
      position: relative;
      overflow: hidden;
      background: rgba(255, 255, 255, 0.07);
    }
    .shimmer::after {
      content: '';
      position: absolute;
      inset: 0;
      transform: translateX(-100%);
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
      animation: shimmer 1.6s infinite;
    }
    @keyframes shimmer {
      to {
        transform: translateX(100%);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .shimmer::after {
        animation: none;
      }
    }
  `,
})
export class LoaderComponent {}
