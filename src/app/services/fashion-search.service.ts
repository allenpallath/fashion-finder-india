import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Product } from '../models/product.model';
import { SearchFormData } from '../models/search-form.model';
import { filterAndRank, queryVariants } from './search-query';
import { ToastService } from './toast.service';

export type SearchState = 'idle' | 'loading' | 'loading-more' | 'success' | 'error';

/** Cards revealed per "Show more". */
const BATCH = 12;

/**
 * Search state for the results popup. One backend search returns ~40 Google
 * Shopping items (no paging), so results are revealed in batches for free;
 * once all are shown, "Find more" runs the next query variant (1 SerpApi
 * credit) and adds only items not seen yet.
 */
@Injectable({ providedIn: 'root' })
export class FashionSearchService {
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  private readonly status = signal<SearchState>('idle');
  /** Everything collected for the current search; the first `shown` are visible. */
  private readonly all = signal<Product[]>([]);
  private readonly shown = signal(0);
  /** True once every query variant has been tried. */
  private readonly exhausted = signal(false);

  readonly state = this.status.asReadonly();
  readonly products = computed(() => this.all().slice(0, this.shown()));
  readonly hasResults = computed(() => this.shown() > 0);
  readonly loadingMore = computed(() => this.status() === 'loading-more');
  /** True when the next "more" click needs a new search. */
  readonly moreUsesSearch = computed(() => this.shown() >= this.all().length);
  readonly canLoadMore = computed(() => !(this.exhausted() && this.moreUsesSearch()));

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
    this.shown.set(0);
    this.exhausted.set(false);
    this.status.set('loading');
    return this.fetch(false);
  }

  /** Reveals the next batch, or searches for more once everything is shown. */
  loadMore(): Observable<Product[]> {
    if (!this.moreUsesSearch()) {
      this.revealNext();
      return of(this.products());
    }
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
        this.revealNext();
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

  private revealNext(): void {
    this.shown.update((n) => Math.min(n + BATCH, this.all().length));
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
