import { Component, input, model } from '@angular/core';

let nextId = 0;

/**
 * Pick-one toggle (e.g. Women | Men) built on native radio buttons, so arrow
 * keys and screen readers work without extra code:
 *   <app-segmented label="Shopping for" [options]="['Women', 'Men']" [(value)]="gender" />
 */
@Component({
  selector: 'app-segmented',
  host: { class: 'lg-bubble inline-flex rounded-full p-1 gap-1', role: 'radiogroup', '[attr.aria-label]': 'label()' },
  template: `
    @for (option of options(); track option) {
      <label class="lg-segment" [class.lg-knob]="option === value()">
        <input type="radio" class="sr-only" [name]="name" [value]="option" [checked]="option === value()" (change)="value.set(option)" />
        {{ option }}
      </label>
    }
  `,
})
export class SegmentedComponent<T extends string = string> {
  options = input.required<readonly T[]>();
  label = input('');
  value = model.required<T>();
  protected readonly name = `segmented-${nextId++}`;
}
