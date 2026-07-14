import { Component, OnInit, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { PublicPortalService } from '../public-portal.service';
import { CardTiltDirective } from '../directives/card-tilt.directive';
import {
  ESCUELA_CARD_CONFIGS,
  type Escuela,
  type EscuelaCardViewModel,
} from '../../../core/models/portal.model';

@Component({
  selector: 'app-home-dashboard',
  standalone: true,
  imports: [CommonModule, TranslatePipe, CardTiltDirective],
  templateUrl: './home-dashboard.component.html',
  styleUrl: './home-dashboard.component.scss',
})
export class HomeDashboardComponent implements OnInit {
  private portal = inject(PublicPortalService);
  private router = inject(Router);

  readonly dashboardActive = signal(false);
  readonly logoError = signal(false);
  readonly escuelaCards = signal<EscuelaCardViewModel[]>([]);
  readonly flippingCardId = signal<number | null>(null);
  readonly hologramTransform = signal('rotateX(0deg) rotateY(0deg)');

  ngOnInit(): void {
    window.setTimeout(() => this.dashboardActive.set(true), 100);
    this.portal.listarEscuelas().subscribe({
      next: (escuelas) => this.escuelaCards.set(this.mapCards(escuelas)),
    });
  }

  @HostListener('document:mousemove', ['$event'])
  onDocumentMouseMove(event: MouseEvent): void {
    const xVal = event.clientX / window.innerWidth - 0.5;
    const yVal = event.clientY / window.innerHeight - 0.5;
    this.hologramTransform.set(
      `rotateX(${-yVal * 24}deg) rotateY(${xVal * 24}deg)`,
    );
  }

  @HostListener('document:mouseleave')
  onDocumentMouseLeave(): void {
    this.hologramTransform.set('rotateX(0deg) rotateY(0deg)');
  }

  onCardClick(card: EscuelaCardViewModel): void {
    if (this.flippingCardId()) return;
    this.flippingCardId.set(card.escuela.id_escuela);
    window.setTimeout(() => {
      this.router.navigate(['/escuelas', card.escuela.id_escuela]);
    }, 750);
  }

  onLogoError(): void {
    this.logoError.set(true);
  }

  trackByEscuelaId(_: number, item: EscuelaCardViewModel): number {
    return item.escuela.id_escuela;
  }

  private mapCards(escuelas: Escuela[]): EscuelaCardViewModel[] {
    return ESCUELA_CARD_CONFIGS.flatMap((config, index) => {
      const escuela = escuelas.find((e) => e.nombre_escuela.includes(config.nameMatch));
      if (!escuela) return [];
      return [{ ...config, escuela, i18nKey: config.themeKey, emergeDelay: (index + 1) * 0.05 }];
    });
  }
}
