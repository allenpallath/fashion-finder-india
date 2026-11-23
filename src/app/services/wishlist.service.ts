import { Injectable, computed, effect, signal } from '@angular/core';
import { Product } from '../models/product.model';

const STORAGE_KEY = 'ff-wishlist';

/** Saved products, newest first. Kept in localStorage on this device only. */
@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly items = signal<Product[]>(load());
  private readonly ids = computed(() => new Set(this.items().map((p) => p.id)));

  readonly products = this.items.asReadonly();
  readonly count = computed(() => this.items().length);

  constructor() {
    effect(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items()));
      } catch {
        // Storage full or blocked: the wishlist lasts until the tab closes.
      }
    });
  }

  has(product: Product): boolean {
    return this.ids().has(product.id);
  }

  toggle(product: Product): void {
    this.items.update((list) => (this.has(product) ? list.filter((p) => p.id !== product.id) : [product, ...list]));
  }
}

function load(): Product[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}
