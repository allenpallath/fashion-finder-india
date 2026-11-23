import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WishlistService } from '../../services/wishlist.service';
import { IconComponent } from '../../shared/icon.component';

/** Round heart link to the wishlist page, with a count badge. */
@Component({
  selector: 'app-wishlist-link',
  imports: [RouterLink, IconComponent],
  template: `
    <a
      routerLink="/wishlist"
      class="lg-bubble relative w-10 h-10 rounded-full grid place-items-center"
      [attr.aria-label]="'Wishlist, ' + wishlist.count() + ' saved'"
    >
      <app-icon name="heart" [size]="18" [filled]="wishlist.count() > 0" [class.text-pink-400]="wishlist.count() > 0" />
      @if (wishlist.count(); as count) {
        <span class="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-white text-black text-[11px] font-semibold grid place-items-center tabular-nums">
          {{ count }}
        </span>
      }
    </a>
  `,
})
export class WishlistLinkComponent {
  protected readonly wishlist = inject(WishlistService);
}
