import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { map } from 'rxjs';
import {
  COLOR_MAP,
  DRESS_TYPES,
  GENDERS,
  Gender,
  OCCASION_OPTIONS,
  STYLE_OPTIONS,
  SearchFormData,
} from '../../models/search-form.model';
import { CtaButtonComponent } from '../../shared/cta-button.component';
import { FieldComponent } from '../../shared/field.component';
import { LiquidGlassDirective } from '../../shared/liquid-glass.directive';
import { SegmentedComponent } from '../../shared/segmented.component';
import { PriceRangeComponent } from '../price-range/price-range.component';
import { GlassSelectComponent } from '../glass-select/glass-select.component';
import { SuggestInputComponent } from '../suggest-input/suggest-input.component';

/** The search form. Women/Men and dress type are required. */
@Component({
  selector: 'app-search-form',
  imports: [
    ReactiveFormsModule,
    LiquidGlassDirective,
    FieldComponent,
    CtaButtonComponent,
    SuggestInputComponent,
    GlassSelectComponent,
    PriceRangeComponent,
    SegmentedComponent,
  ],
  // relative z-10: open dropdowns stay above the content after the form.
  host: { class: 'block relative z-10' },
  template: `
    <section id="search-form" class="w-full max-w-6xl mx-auto px-4 pt-4 pb-6 sm:pt-5 scroll-mt-6">
      <div liquidGlass class="lg-panel lg-rim rounded-[2rem] sm:rounded-[2.75rem] p-5 sm:p-8">
        <div class="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <p class="text-white/45 text-sm mb-1">Your dress</p>
            <h2 class="text-2xl sm:text-3xl font-medium tracking-tight">What are you looking for?</h2>
          </div>
          <app-segmented label="Shopping for" [options]="genders" [(value)]="gender" />
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-6">
          <div class="grid sm:grid-cols-2 gap-5">
            <app-field label="Dress type *" controlId="dressType" [error]="showError('dressType') ? 'Dress type is required' : null">
              <app-suggest-input
                inputId="dressType"
                formControlName="dressType"
                [placeholder]="dressTypes().placeholder"
                [suggestions]="dressTypes().suggestions"
                [invalid]="showError('dressType')"
              />
            </app-field>

            <app-field label="Colour" controlId="colour">
              <div class="relative">
                <input
                  id="colour"
                  formControlName="colour"
                  placeholder="Emerald green, dusty rose, ivory…"
                  class="lg-input pr-14"
                />
                @if (swatch(); as colour) {
                  <span
                    class="absolute right-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full ring-2 ring-white/70"
                    [style.background-color]="colour"
                  ></span>
                }
              </div>
            </app-field>

            <app-field label="Occasion">
              <app-glass-select labelledBy="occasion-label" anyLabel="Any occasion" [options]="occasionOptions" [(values)]="occasions" />
            </app-field>

            <app-field label="Style / fit">
              <app-glass-select labelledBy="style-fit-label" anyLabel="Any style" [options]="styleOptions" [(values)]="styles" />
            </app-field>
          </div>

          <app-price-range [(min)]="minPrice" [(max)]="maxPrice" />

          <button type="submit" appCta icon="search" [disabled]="!formValid()">Search</button>
        </form>
      </div>
    </section>
  `,
})
export class SearchFormComponent implements OnInit {
  /** Values to start with, e.g. the last search when coming back from the results page. */
  initial = input<SearchFormData | null>(null);
  searchSubmit = output<SearchFormData>();

  protected readonly genders = GENDERS;
  protected readonly occasionOptions = OCCASION_OPTIONS;
  protected readonly styleOptions = STYLE_OPTIONS;

  protected readonly form = inject(FormBuilder).nonNullable.group({
    dressType: ['', Validators.required],
    colour: [''],
  });
  protected gender = signal<Gender>('Women');
  /** Dress type suggestions follow the Women/Men choice. */
  protected dressTypes = computed(() => DRESS_TYPES[this.gender()]);
  protected occasions = signal<string[]>([]);
  protected styles = signal<string[]>([]);
  protected minPrice = signal(0);
  protected maxPrice = signal<number | null>(2000);
  private submitted = signal(false);

  protected formValid = toSignal(this.form.statusChanges.pipe(map((s) => s === 'VALID')), { initialValue: false });
  private colour = toSignal(this.form.controls.colour.valueChanges, { initialValue: '' });

  /** Preview swatch for known colour names. */
  protected swatch = computed(() => COLOR_MAP[this.colour().toLowerCase().trim()] ?? null);

  ngOnInit(): void {
    const last = this.initial();
    if (!last) return;
    this.form.setValue({ dressType: last.dressType, colour: last.colour });
    this.gender.set(last.gender);
    // Drop options that no longer exist (older saved searches).
    this.styles.set(last.styles.filter((s) => STYLE_OPTIONS.includes(s)));
    this.occasions.set(last.occasions.filter((o) => OCCASION_OPTIONS.includes(o)));
    this.minPrice.set(last.minPrice);
    this.maxPrice.set(last.maxPrice);
  }

  protected showError(field: 'dressType'): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.touched || this.submitted());
  }

  protected submit(): void {
    this.submitted.set(true);
    this.form.markAllAsTouched();
    if (!this.formValid()) return;
    this.searchSubmit.emit({
      ...this.form.getRawValue(),
      gender: this.gender(),
      styles: this.styles(),
      occasions: this.occasions(),
      minPrice: this.minPrice(),
      maxPrice: this.maxPrice(),
    });
  }
}
