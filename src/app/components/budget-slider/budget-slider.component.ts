import { AfterViewInit, Component, ElementRef, OnDestroy, model, viewChild } from '@angular/core';
import * as noUiSlider from 'nouislider';
import { BUDGET_STEPS, formatBudget, shortBudget } from '../../models/search-form.model';

/** Budget picker: a noUiSlider that snaps to BUDGET_STEPS, plus clickable tick labels. */
@Component({
  selector: 'app-budget-slider',
  host: { class: 'block' },
  template: `
    <div class="flex items-end justify-between mb-4">
      <span class="lg-label !mb-0">Budget</span>
      <span class="text-right leading-none">
        <span class="text-3xl font-extralight tracking-tight">{{ format(value()) }}</span>
        <span class="block text-[11px] text-white/45 mt-1">max price</span>
      </span>
    </div>
    <div class="px-3 sm:px-8 pt-5">
      <div #track class="ff-slider"></div>
      <div class="relative h-5 mt-5">
        @for (step of steps; track step; let i = $index) {
          <button
            type="button"
            class="absolute -translate-x-1/2 text-[11px] transition-colors"
            [style.left.%]="(i * 100) / (steps.length - 1)"
            [class]="value() === step ? 'text-white font-semibold' : 'text-white/40 hover:text-white/80'"
            (click)="slider?.set(step)"
          >
            {{ short(step) }}
          </button>
        }
      </div>
    </div>
  `,
})
export class BudgetSliderComponent implements AfterViewInit, OnDestroy {
  value = model(2000);

  protected readonly steps = BUDGET_STEPS;
  protected readonly format = formatBudget;
  protected readonly short = shortBudget;
  protected slider?: noUiSlider.API;
  private readonly track = viewChild.required<ElementRef<HTMLElement>>('track');

  ngAfterViewInit(): void {
    // Evenly spaced stops: min, 20%, 40%, … max.
    const inner = this.steps.slice(1, -1).map((step, i) => [`${((i + 1) * 100) / (this.steps.length - 1)}%`, step]);
    this.slider = noUiSlider.create(this.track().nativeElement, {
      start: [this.value()],
      snap: true,
      connect: [true, false],
      range: { min: this.steps[0], max: this.steps[this.steps.length - 1], ...Object.fromEntries(inner) },
    });
    this.slider.on('update', ([v]) => this.value.set(Math.round(Number(v))));
  }

  ngOnDestroy(): void {
    this.slider?.destroy();
  }
}
