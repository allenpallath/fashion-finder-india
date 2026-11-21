import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { Product } from '../models/product.model';

/**
 * Opens a product on its store's own page. The search only returns a Google
 * Shopping link, so the direct link for the card's store is looked up on click
 * (1 SerpApi credit, cached). If that store isn't found, the Google Shopping
 * page opens instead; it lists every store selling the item.
 */
@Injectable({ providedIn: 'root' })
export class StoreLinkService {
  private http = inject(HttpClient);
  private cache = new Map<string, string>();

  /** Opens a tab right away (so pop-up blockers allow it), then sends it to the store. */
  async open(product: Product): Promise<void> {
    const tab = window.open('', '_blank');
    if (tab) tab.opener = null;
    const link = await this.resolve(product);
    if (tab) tab.location.href = link;
    else window.open(link, '_blank', 'noopener');
  }

  private async resolve(product: Product): Promise<string> {
    const key = product.detailsToken || product.id;
    if (!this.cache.has(key)) {
      this.cache.set(key, (await this.lookUp(product)) || product.productLink);
    }
    return this.cache.get(key)!;
  }

  /** The store's direct link, or '' if it can't be found (reason logged to the console). */
  private async lookUp(product: Product): Promise<string> {
    if (!product.detailsToken) return '';
    try {
      const params = { token: product.detailsToken, store: product.website };
      const { link } = await firstValueFrom(this.http.get<{ link: string }>(`${environment.apiBase}/store-link`, { params }));
      return /^https?:\/\//i.test(link) ? link : '';
    } catch (error: any) {
      console.info(`View product: ${error?.error?.error ?? 'lookup failed.'} Opening Google Shopping.`);
      return '';
    }
  }
}
