import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Product } from '../models/product.model';
import { SearchFormData } from '../models/search-form.model';
import { filterAndRank, queryVariants } from './search-query';
import { ToastService } from './toast.service';

export type SearchState = 'idle' | 'loading' | 'loading-more' | 'success' | 'error';

/**
 * Search state for the results popup. One backend search returns ~40 Google
 * Shopping items (no paging), all shown at once. "Find more" runs the next
 * query variant (1 SerpApi credit) and appends only items not seen yet.
 */
@Injectable({ providedIn: 'root' })
export class FashionSearchService {
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  private readonly status = signal<SearchState>('idle');
  /** Everything collected for the current search. */
  private readonly all = signal<Product[]>([]);
  /** True once every query variant has been tried. */
  private readonly exhausted = signal(false);

  readonly state = this.status.asReadonly();
  readonly products = this.all.asReadonly();
  readonly hasResults = computed(() => this.all().length > 0);
  readonly loadingMore = computed(() => this.status() === 'loading-more');
  readonly canLoadMore = computed(() => !this.exhausted());

  private form: SearchFormData | null = null;
  private queries: string[] = [];
  private queryIndex = 0;
  private seen = new Set<string>();

  search(form: SearchFormData): Observable<Product[]> {
    this.form = form;
    this.queries = queryVariants(form);
    this.queryIndex = 0;
    this.seen.clear();
    this.all.set([]);
    this.exhausted.set(false);
    this.status.set('loading');
    return this.fetch(false);
  }

  /** Runs the next query variant and appends its new items. */
  loadMore(): Observable<Product[]> {
    if (this.queryIndex + 1 >= this.queries.length) {
      this.exhausted.set(true);
      this.toast.show("That's everything we could find. Try changing your filters.", 'info');
      return of([]);
    }
    this.queryIndex++;
    this.status.set('loading-more');
    return this.fetch(true);
  }

  private fetch(append: boolean): Observable<Product[]> {
    const q = this.queries[this.queryIndex];
    return this.http.get<{ products: Product[] }>(`${environment.apiBase}/search`, { params: { q } }).pipe(
      map((res) => this.unseen(filterAndRank(res.products ?? [], this.form!))),
      tap((fresh) => {
        this.all.update((list) => [...list, ...fresh]);
        this.status.set('success');
        if (append && !fresh.length) {
          this.toast.show('No new items this time. Tap "Find more" again to try a broader search.', 'info');
        }
      }),
      catchError((error: HttpErrorResponse) => {
        this.toast.show(errorMessage(error));
        // A failed "Find more" keeps the results already shown.
        this.status.set(append && this.hasResults() ? 'success' : 'error');
        return of([]);
      })
    );
  }

  /** Drops items already collected; the same product can come back in later searches. */
  private unseen(products: Product[]): Product[] {
    return products.filter((p) => {
      const keys = [p.id, `${p.website}|${p.productName.toLowerCase()}`];
      if (keys.some((k) => this.seen.has(k))) return false;
      keys.forEach((k) => this.seen.add(k));
      return true;
    });
  }
}

/** Message for the error toast. The backend replies with `{ error }`; anything else means it isn't reachable. */
function errorMessage(error: HttpErrorResponse): string {
  if (error.status === 401 || error.status === 403) return 'The search key was rejected. Check SERPAPI_KEY on the server.';
  if (error.status === 429) return 'Search limit reached. Please try again later.';
  return error.error?.error ?? "Can't reach the search server. Please try again.";
}
