import { Component, input } from '@angular/core';
import { IconComponent, IconName } from './icon.component';
import { LiquidGlassDirective } from './liquid-glass.directive';

/**
 * The app's main button: a glass pill with a white knob icon, a label and
 * trailing dots. Works on <button> and <a>:
 *   <button appCta icon="search" size="xs">Search again</button>
 * While `busy`, the knob shows a spinner and the dots pulse.
 */
@Component({
  selector: 'button[appCta], a[appCta]',
  imports: [IconComponent],
  hostDirectives: [LiquidGlassDirective],
  host: {
    class: 'lg-cta',
    '[class.lg-cta--sm]': "size() === 'sm'",
    '[class.lg-cta--xs]': "size() === 'xs'",
    '[class.lg-cta--busy]': 'busy()',
    '[attr.aria-busy]': 'busy() || null',
  },
  template: `
    <span class="lg-cta__knob">
      @if (busy()) {
        <span class="lg-spinner"></span>
      } @else {
        <app-icon [name]="icon()" [size]="size() === 'lg' ? 20 : 16" />
      }
    </span>
    <span class="lg-cta__label"><ng-content /></span>
    <span class="lg-dots"><i></i><i></i><i></i></span>
  `,
})
export class CtaButtonComponent {
  icon = input<IconName>('arrow-right');
  size = input<'lg' | 'sm' | 'xs'>('lg');
  busy = input(false);
}
