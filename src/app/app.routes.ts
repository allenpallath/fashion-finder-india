import { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home-page.component';

/** The results and wishlist pages are lazy-loaded in their own chunks. */
export const routes: Routes = [
  { path: '', component: HomePageComponent, title: 'FashionFinder India — Fashion Search' },
  {
    path: 'results',
    loadComponent: () => import('./pages/results-page.component').then((m) => m.ResultsPageComponent),
    title: 'Results · FashionFinder India',
  },
  {
    path: 'wishlist',
    loadComponent: () => import('./pages/wishlist-page.component').then((m) => m.WishlistPageComponent),
    title: 'Wishlist · FashionFinder India',
  },
  { path: '**', redirectTo: '' },
];
