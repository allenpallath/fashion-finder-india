import { Component, computed, input } from '@angular/core';

/** Stroke icons on a 24×24 grid; each is one or more SVG path definitions. */
const ICONS = {
  'arrow-right': ['M5 12h14M13 6l6 6-6 6'],
  'chevron-left': ['M15 18l-6-6 6-6'],
  'chevron-right': ['M9 6l6 6-6 6'],
  'chevron-down': ['M6 9l6 6 6-6'],
  search: ['M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z'],
  plus: ['M12 5v14M5 12h14'],
  close: ['M6 6l12 12M18 6L6 18'],
  check: ['M5 12.5l4.5 4.5L19 7.5'],
  external: ['M7 17L17 7M9 7h8v8'],
  list: ['M4 6h16M4 12h16M4 18h10'],
  warning: ['M12 9v4m0 4h.01M10.3 3.9L2.4 18a2 2 0 001.7 3h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z'],
  info: ['M12 16v-4m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'],
  hanger: ['M14 6a2 2 0 1 0-4 0c0 1.7.7 3 2 4M12 10l8.2 4.6a1.6 1.6 0 0 1 .8 1.4v.4a1.6 1.6 0 0 1-1.6 1.6H4.6A1.6 1.6 0 0 1 3 16.4V16a1.6 1.6 0 0 1 .8-1.4z'],
} as const;

export type IconName = keyof typeof ICONS;

/** Inline SVG icon drawn in the current text colour: <app-icon name="search" [size]="20" />. */
@Component({
  selector: 'app-icon',
  host: { class: 'inline-block shrink-0', 'aria-hidden': 'true' },
  template: `
    <svg
      class="block"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      [attr.width]="size()"
      [attr.height]="size()"
      [attr.stroke-width]="stroke()"
    >
      @for (d of paths(); track d) {
        <path [attr.d]="d" />
      }
    </svg>
  `,
})
export class IconComponent {
  name = input.required<IconName>();
  size = input(16);
  stroke = input(2);

  protected paths = computed(() => ICONS[this.name()]);
}
