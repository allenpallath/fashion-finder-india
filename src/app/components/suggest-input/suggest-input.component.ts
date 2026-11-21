import { Component, ElementRef, computed, forwardRef, inject, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { moveHighlight } from '../../shared/listbox';

let nextId = 0;
const MAX_SUGGESTIONS = 8;

/** Text input with a suggestion list (combobox). Works with formControlName. */
@Component({
  selector: 'app-suggest-input',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SuggestInputComponent), multi: true }],
  host: { class: 'block relative', '(document:click)': 'closeIfOutside($event)' },
  template: `
    <input
      type="text"
      class="lg-input"
      autocomplete="off"
      role="combobox"
      aria-autocomplete="list"
      [class.lg-input--error]="invalid()"
      [id]="inputId()"
      [placeholder]="placeholder()"
      [value]="text()"
      [disabled]="disabled()"
      [attr.aria-expanded]="showList()"
      [attr.aria-controls]="listId"
      [attr.aria-activedescendant]="showList() && active() >= 0 ? listId + '-' + active() : null"
      (input)="type($any($event.target).value)"
      (focus)="open.set(true)"
      (blur)="onTouched()"
      (keydown)="onKeydown($event)"
    />

    @if (showList()) {
      <ul class="lg-panel lg-rim lg-menu" role="listbox" [id]="listId" animate.enter="lg-menu-enter" animate.leave="lg-menu-leave">
        @for (item of matches(); track item; let i = $index) {
          <li
            role="option"
            class="lg-option"
            [class.lg-option--active]="i === active()"
            [id]="listId + '-' + i"
            [style.--i]="i"
            [attr.aria-selected]="i === active()"
            (mouseenter)="active.set(i)"
            (mousedown)="$event.preventDefault()"
            (click)="pick(item)"
          >
            {{ item }}
          </li>
        }
      </ul>
    }
  `,
})
export class SuggestInputComponent implements ControlValueAccessor {
  suggestions = input.required<string[]>();
  placeholder = input('');
  inputId = input('');
  invalid = input(false);

  protected readonly listId = `suggest-${nextId++}`;
  protected text = signal('');
  protected open = signal(false);
  protected active = signal(-1);
  protected disabled = signal(false);

  /** Suggestions starting with the typed text first, then ones containing it. */
  protected matches = computed(() => {
    const query = this.text().trim().toLowerCase();
    const all = this.suggestions();
    const starts = all.filter((s) => s.toLowerCase().startsWith(query));
    const contains = all.filter((s) => !starts.includes(s) && s.toLowerCase().includes(query));
    return [...starts, ...contains].filter((s) => s.toLowerCase() !== query).slice(0, MAX_SUGGESTIONS);
  });
  protected showList = computed(() => this.open() && this.matches().length > 0);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private onChange: (value: string) => void = () => {};
  protected onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    this.text.set(value ?? '');
  }
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
  }

  protected type(value: string): void {
    this.text.set(value);
    this.onChange(value);
    this.open.set(true);
    this.active.set(-1);
  }

  protected pick(value: string): void {
    this.type(value);
    this.open.set(false);
  }

  protected closeIfOutside(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) this.open.set(false);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const next = moveHighlight(event.key, this.active(), this.matches().length);
    if (next !== null && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault();
      this.open.set(true);
      this.active.set(next);
    } else if (event.key === 'Enter' && this.showList() && this.active() >= 0) {
      event.preventDefault(); // pick the suggestion instead of submitting the form
      this.pick(this.matches()[this.active()]);
    } else if (event.key === 'Escape' || event.key === 'Tab') {
      this.open.set(false);
    }
  }
}
