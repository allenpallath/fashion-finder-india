import { Component, computed, input } from '@angular/core';

/**
 * Form field wrapper: a label, the projected control and
 * an error line. The label's id is `<controlId or label>-label`, for controls
 * that need aria-labelledby.
 */
@Component({
  selector: 'app-field',
  host: { class: 'block' },
  template: `
    <label class="lg-label" [id]="labelId()" [attr.for]="controlId() || null">{{ label() }}</label>
    <ng-content />
    @if (error()) {
      <p class="text-xs text-rose-300 mt-2">{{ error() }}</p>
    }
  `,
})
export class FieldComponent {
  label = input.required<string>();
  controlId = input('');
  error = input<string | null>(null);

  readonly labelId = computed(() => `${this.controlId() || this.label().toLowerCase().replace(/\W+/g, '-')}-label`);
}
