import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

/** Ruta inexistente (`**`) — prototipo «Eduinova Estados › 404». */
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <main class="nf">
      <div class="nf__card">
        <span class="nf__code" aria-hidden="true">404</span>
        <h1>{{ 'notFound.title' | translate }}</h1>
        <p>{{ 'notFound.message' | translate }}</p>
        <a routerLink="/" class="nf__btn">
          <i class="ti ti-arrow-left" aria-hidden="true"></i>
          {{ 'notFound.back' | translate }}
        </a>
      </div>
    </main>
  `,
  styleUrl: './not-found.component.scss',
})
export class NotFoundComponent {}
