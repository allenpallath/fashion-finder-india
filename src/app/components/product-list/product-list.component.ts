import { Component, input } from '@angular/core';
import { Product } from '../../models/product.model';
import { ProductCardComponent } from '../product-card/product-card.component';

/** Products as a vertical list of wide cards: one column on phones, two on large screens. */
@Component({
  selector: 'app-product-list',
  imports: [ProductCardComponent],
  host: { class: 'grid gap-3 sm:gap-4 lg:grid-cols-2' },
  template: `
    @for (product of products(); track product.id) {
      <app-product-card [product]="product" />
    }
  `,
})
export class ProductListComponent {
  products = input.required<Product[]>();
}
