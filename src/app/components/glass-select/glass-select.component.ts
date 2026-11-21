import { Component, ElementRef, computed, inject, input, model, signal, viewChild } from '@angular/core';
import { IconComponent } from '../../shared/icon.component';
import { moveHighlight } from '../../shared/listbox';

let nextId = 0;

/** Multi-select dropdown. The first option ("Any …") clears the selection; the menu stays open while picking. */
@Component({
  selector: 'app-glass-select',
  imports: [IconComponent],
  host: { class: 'block relative', '(document:click)': 'closeIfOutside($event)', '(keydown)': 'onKeydown($event)' },
  template: `
    <button
      #trigger
      type="button"
      class="lg-input flex items-center justify-between gap-3 text-left"
      aria-haspopup="listbox"
      [attr.aria-expanded]="open()"
      [attr.aria-controls]="id + '-list'"
      [attr.aria-activedescendant]="open() ? id + '-' + active() : null"
      [attr.aria-labelledby]="labelledBy() || null"
      (click)="toggle()"
    >
      <span class="truncate" [class]="values().length ? '' : 'text-white/60'">{{ summary() }}</span>
      <app-icon name="chevron-down" class="text-white/70 transition-transform duration-300" [class.rotate-180]="open()" />
    </button>

    @if (open()) {
      <!-- No liquidGlass here: hovering repaints part of the menu and Chromium misplaces SVG backdrop filters on partial repaints. -->
      <ul class="lg-panel lg-rim lg-menu" role="listbox" aria-multiselectable="true" [id]="id + '-list'" animate.enter="lg-menu-enter" animate.leave="lg-menu-leave">
        @for (option of choices(); track option; let i = $index) {
          <li
            role="option"
            class="lg-option"
            [class.lg-option--active]="i === active()"
            [id]="id + '-' + i"
            [style.--i]="i"
            [attr.aria-selected]="isSelected(option)"
            (mouseenter)="active.set(i)"
            (click)="choose(option)"
          >
            <span class="lg-checkbox" [class.lg-checkbox--on]="isSelected(option)">
              @if (isSelected(option)) {
                <app-icon name="check" [size]="12" [stroke]="3" />
              }
            </span>
            <span class="truncate">{{ option || anyLabel() }}</span>
          </li>
        }
      </ul>
    }
  `,
})
export class GlassSelectComponent {
  options = input.required<string[]>();
  /** Text for the "nothing selected" option and the empty trigger, e.g. "Any style". */
  anyLabel = input('Any');
  /** Id of the visible label, for screen readers. */
  labelledBy = input('');
  values = model<string[]>([]);

  protected readonly id = `glass-select-${nextId++}`;
  protected open = signal(false);
  protected active = signal(0);
  /** '' stands for the "Any …" option. */
  protected choices = computed(() => ['', ...this.options()]);
  protected summary = computed(() => {
    const picked = this.values();
    if (!picked.length) return this.anyLabel();
    return picked.length <= 2 ? picked.join(', ') : `${picked.length} selected`;
  });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');

  protected isSelected(option: string): boolean {
    return option === '' ? !this.values().length : this.values().includes(option);
  }

  protected toggle(): void {
    this.active.set(0);
    this.open.update((open) => !open);
  }

  protected choose(option: string): void {
    const current = this.values();
    if (option === '') this.values.set([]);
    else this.values.set(current.includes(option) ? current.filter((v) => v !== option) : [...current, option]);
  }

  protected closeIfOutside(event: MouseEvent): void {
    if (!this.host.nativeElement.contains(event.target as Node)) this.open.set(false);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const opensMenu = ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key);
    if (!this.open()) {
      if (opensMenu) {
        event.preventDefault();
        this.toggle();
      }
      return;
    }
    const next = moveHighlight(event.key, this.active(), this.choices().length);
    if (next !== null) {
      event.preventDefault();
      this.active.set(next);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.choose(this.choices()[this.active()]);
    } else if (event.key === 'Escape' || event.key === 'Tab') {
      this.open.set(false);
      if (event.key === 'Escape') this.trigger().nativeElement.focus();
    }
  }
}
