import { Component, input } from '@angular/core';
import { IconComponent, IconName } from './icon.component';

/**
 * Round white "knob" button holding one icon. Works on <button> and <a>:
 *   <button appIconButton icon="close" [size]="44" aria-label="Close"></button>
 * `size` is the diameter in px. Always give it an aria-label.
 */
@Component({
  selector: 'button[appIconButton], a[appIconButton]',
  imports: [IconComponent],
  host: {
    class: 'lg-knob rounded-full grid place-items-center shrink-0',
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
  },
  template: `<app-icon [name]="icon()" [size]="size() >= 40 ? 16 : 14" />`,
})
export class IconButtonComponent {
  icon = input.required<IconName>();
  size = input(40);
}
