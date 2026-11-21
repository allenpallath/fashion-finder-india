import { Component } from '@angular/core';
import { LiquidGlassDirective } from '../../shared/liquid-glass.directive';

/** Loading state for the results popup: a status pill and skeleton cards. */
@Component({
  selector: 'app-loader',
  imports: [LiquidGlassDirective],
  host: { class: 'block py-4' },
  template: `
    <div liquidGlass class="lg-panel lg-rim rounded-full max-w-xl mx-auto pl-2 pr-6 py-2 flex items-center gap-4 mb-6">
      <span class="lg-cta__knob w-12 h-12"><span class="lg-spinner"></span></span>
      <span class="flex-1 min-w-0">
        <span class="block text-sm font-medium truncate">Searching Myntra, Nykaa, AJIO, Amazon & Flipkart…</span>
        <span class="block text-xs text-white/45">Searching Google Shopping · usually a few seconds</span>
      </span>
      <span class="lg-dots lg-dots--busy hidden sm:flex"><i></i><i></i><i></i></span>
    </div>

    <!-- One skeleton on phones, two on tablets, three on desktop. -->
    <div class="flex gap-6 justify-center pb-6">
      @for (visibility of ['', 'hidden sm:block', 'hidden lg:block']; track $index) {
        <div class="lg-card lg-rim w-[260px] shrink-0 rounded-[2rem] p-2" [class]="visibility">
          <div class="h-[210px] rounded-[1.6rem] shimmer"></div>
          <div class="px-3 pt-4 pb-2 space-y-3">
            <div class="h-3 w-4/5 rounded-full shimmer"></div>
            <div class="h-3 w-1/2 rounded-full shimmer"></div>
            <div class="h-8 w-2/5 rounded-full shimmer mt-4"></div>
            <div class="h-12 w-full rounded-full shimmer mt-4"></div>
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
