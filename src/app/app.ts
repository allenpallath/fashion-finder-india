import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastHostComponent } from './components/toast/toast-host.component';
import { WavesBackgroundComponent } from './components/waves-background/waves-background.component';

/** App shell: background, the current page (see app.routes.ts) and toasts. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, WavesBackgroundComponent, ToastHostComponent],
  template: `
    <app-waves-background />
    <router-outlet />
    <app-toast-host />
  `,
})
export class App {}
