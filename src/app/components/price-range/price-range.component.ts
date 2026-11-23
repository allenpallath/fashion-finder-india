import { AfterViewInit, Component, ElementRef, OnDestroy, model, signal, viewChild } from '@angular/core';
import * as noUiSlider from 'nouislider';
import { PRICE_SLIDER_MAX } from '../../models/search-form.model';

/** Pause in typing after which a typed price moves the slider. */
const TYPE_DEBOUNCE_MS = 400;

/** Slider ticks: position along the track (%) and value. The last one means "no upper limit". */
const TICKS = [
  { at: 0, value: 0, label: '₹0' },
  { at: 20, value: 1000, label: '₹1k' },
  { at: 40, value: 2000, label: '₹2k' },
  { at: 70, value: 5000, label: '₹5k' },
  { at: 100, value: PRICE_SLIDER_MAX, label: '₹10k+' },
];

/**
 * Price range: two typed boxes (Min / Max) and a two-knob slider kept in sync.
 * Min 0 = no lower limit; max null = no upper limit (knob at the right end or box left empty).
 * Typed prices can be anything, e.g. ₹1,234 or ₹25,000; the slider just shows them as close as it can.
 */
@Component({
  selector: 'app-price-range',
  host: { class: 'block' },
  template: `
    <div class="flex flex-wrap items-end justify-between gap-3 mb-5">
      <span class="lg-label !mb-0">Price range</span>
      <div class="flex items-center gap-2 w-full sm:w-auto">
        @for (box of boxes; track box.key) {
          @if (box.key === 'max') {
            <span class="text-white/30" aria-hidden="true">–</span>
          }
          <label
            class="lg-input flex-1 sm:w-40 sm:flex-none flex items-center gap-2 !py-2.5 !px-4 cursor-text
              focus-within:border-white/40 focus-within:shadow-[0_0_0_4px_rgba(255,255,255,0.12)]"
          >
            <span class="text-[10px] uppercase tracking-[0.14em] text-white/45">{{ box.label }}</span>
            <span class="text-white/60">₹</span>
            <input
              type="text"
              inputmode="numeric"
              autocomplete="off"
              maxlength="9"
              class="min-w-0 w-full bg-transparent outline-none text-lg font-light placeholder:text-white/40"
              [attr.aria-label]="box.aria"
              [placeholder]="box.placeholder"
              [value]="boxText(box.key)"
              (focus)="startEditing(box.key)"
              (input)="onType(box.key, $event)"
              (blur)="commit(box.key, $event)"
              (keydown.enter)="commit(box.key, $event)"
            />
          </label>
        }
      </div>
    </div>
    <div class="px-3 sm:px-8 pt-5">
      <div #track class="ff-slider"></div>
      <div class="relative h-5 mt-5">
        @for (tick of ticks; track tick.at) {
          <button
            type="button"
            class="absolute -translate-x-1/2 text-[11px] text-white/40 hover:text-white/80 transition-colors"
            [style.left.%]="tick.at"
            (click)="pickTick(tick.value)"
          >
            {{ tick.label }}
          </button>
        }
      </div>
    </div>
  `,
})
export class PriceRangeComponent implements AfterViewInit, OnDestroy {
  min = model(0);
  max = model<number | null>(2000);

  protected readonly ticks = TICKS;
  protected readonly boxes = [
    { key: 'min', label: 'Min', placeholder: '0', aria: 'Minimum price in rupees' },
    { key: 'max', label: 'Max', placeholder: 'No limit', aria: 'Maximum price in rupees' },
  ] as const;

  private slider?: noUiSlider.API;
  /** True while the slider is moved from code, so its update event doesn't overwrite typed values. */
  private syncing = false;
  private typingTimer?: ReturnType<typeof setTimeout>;
  /** The box being typed in, and its text when focus started (see boxText). */
  private readonly editing = signal<'min' | 'max' | null>(null);
  private editingText = '';
  private readonly track = viewChild.required<ElementRef<HTMLElement>>('track');

  ngAfterViewInit(): void {
    this.slider = noUiSlider.create(this.track().nativeElement, {
      start: this.knobs(),
      connect: true,
      // Finer steps at the low end, where most budgets are.
      range: { min: [0, 100], '40%': [2000, 250], '70%': [5000, 500], max: [PRICE_SLIDER_MAX] },
      handleAttributes: [{ 'aria-label': 'Minimum price' }, { 'aria-label': 'Maximum price' }],
    });
    this.slider.on('update', (values) => {
      if (this.syncing) return;
      const [lo, hi] = values.map((v) => Math.round(Number(v)));
      this.min.set(lo);
      this.max.set(hi >= PRICE_SLIDER_MAX ? null : hi);
    });
  }

  ngOnDestroy(): void {
    clearTimeout(this.typingTimer);
    this.slider?.destroy();
  }

  /**
   * Text bound to a box. The box being typed in keeps an unchanging value, so live
   * updates from the debounce don't rewrite it under the cursor.
   */
  protected boxText(key: 'min' | 'max'): string {
    if (this.editing() === key) return this.editingText;
    return this.display(key === 'min' ? this.min() : this.max());
  }

  protected startEditing(key: 'min' | 'max'): void {
    this.editingText = this.display(key === 'min' ? this.min() : this.max());
    this.editing.set(key);
  }

  /** "1,500" for the boxes; empty shows the placeholder (0 / No limit). */
  private display(value: number | null): string {
    return value ? value.toLocaleString('en-IN') : '';
  }

  /**
   * While typing, the price is applied once the user pauses (TYPE_DEBOUNCE_MS), so the
   * slider follows along. The box text stays as typed; it's tidied on blur / Enter.
   */
  protected onType(key: 'min' | 'max', event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^\d,]/g, '');
    clearTimeout(this.typingTimer);
    this.typingTimer = setTimeout(() => {
      const typed = parseInt(input.value.replace(/\D/g, ''), 10) || 0;
      // Set the value only if the knobs are still in order; a swap waits for blur / Enter.
      if (key === 'min' && (this.max() == null || typed <= this.max()!)) this.apply(typed, this.max());
      if (key === 'max' && (!typed || typed >= this.min())) this.apply(this.min(), typed || null);
    }, TYPE_DEBOUNCE_MS);
  }

  /** Applies a typed price on blur / Enter. A min above the max (or the reverse) swaps the two. */
  protected commit(key: 'min' | 'max', event: Event): void {
    clearTimeout(this.typingTimer);
    this.editing.set(null);
    const input = event.target as HTMLInputElement;
    const typed = parseInt(input.value.replace(/\D/g, ''), 10) || 0;
    let min = key === 'min' ? typed : this.min();
    let max = key === 'max' ? typed || null : this.max();
    if (max != null && min > max) [min, max] = [max, min];
    this.apply(min, max);
    // The binding won't redraw if the value didn't change (e.g. "abc" → 0), so tidy the box here.
    input.value = this.display(key === 'min' ? this.min() : this.max());
  }

  /** A tick moves whichever knob is closer to it. */
  protected pickTick(value: number): void {
    const hi = this.max() ?? PRICE_SLIDER_MAX;
    const moveMin = value <= this.min() || (value < hi && value - this.min() < hi - value);
    if (moveMin) this.apply(value, this.max());
    else this.apply(this.min(), value >= PRICE_SLIDER_MAX ? null : value);
  }

  private apply(min: number, max: number | null): void {
    this.min.set(min);
    this.max.set(max);
    this.syncing = true;
    this.slider?.set(this.knobs());
    this.syncing = false;
  }

  private knobs(): number[] {
    return [this.min(), Math.min(this.max() ?? PRICE_SLIDER_MAX, PRICE_SLIDER_MAX)];
  }
}
