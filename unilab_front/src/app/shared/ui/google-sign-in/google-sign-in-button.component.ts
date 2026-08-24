import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  NgZone,
  OnDestroy,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import { I18nService } from '../../../core/i18n/i18n.service';
import { GOOGLE_OAUTH_CLIENT_ID } from '../../../core/config/google.config';

interface GoogleCredentialResponse {
  credential: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: string;
              size?: string;
              text?: string;
              shape?: string;
              width?: number;
              locale?: string;
              logo_alignment?: string;
            },
          ) => void;
        };
      };
    };
  }
}

@Component({
  selector: 'app-google-sign-in',
  standalone: true,
  templateUrl: './google-sign-in-button.component.html',
  styleUrl: './google-sign-in-button.component.scss',
})
export class GoogleSignInButtonComponent implements AfterViewInit, OnDestroy {
  /** Alineado al login: `default` (azul UniLab) · `codex` (portal dorado) */
  @Input() variant: 'default' | 'codex' = 'default';
  @Input() ariaLabel = 'Sign in with Google';
  @Input() label = 'Continuar con Google';
  @Output() credential = new EventEmitter<string>();

  @ViewChild('host', { static: true }) host!: ElementRef<HTMLDivElement>;
  @ViewChild('wrap', { static: true }) wrap!: ElementRef<HTMLDivElement>;

  @HostBinding('class.google-sign-in--codex')
  get isCodex(): boolean {
    return this.variant === 'codex';
  }

  private ngZone = inject(NgZone);
  private i18n = inject(I18nService);
  private resizeObserver: ResizeObserver | null = null;
  private lastWidth = 0;
  private initialized = false;

  ngAfterViewInit(): void {
    if (!GOOGLE_OAUTH_CLIENT_ID) return;

    this.loadScript()
      .then(() => {
        this.renderButton(true);
        this.observeResize();
      })
      .catch(() => undefined);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  private observeResize(): void {
    if (typeof ResizeObserver === 'undefined') return;
    this.resizeObserver = new ResizeObserver(() => {
      const width = Math.floor(this.wrap.nativeElement.clientWidth);
      if (Math.abs(width - this.lastWidth) < 12) return;
      this.renderButton(false);
    });
    this.resizeObserver.observe(this.wrap.nativeElement);
  }

  private loadScript(): Promise<void> {
    if (window.google?.accounts?.id) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-unilab-gis]');
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject());
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset['unilabGis'] = 'true';
      script.onload = () => resolve();
      script.onerror = () => reject();
      document.head.appendChild(script);
    });
  }

  private renderButton(forceInit: boolean): void {
    const google = window.google?.accounts?.id;
    if (!google || !GOOGLE_OAUTH_CLIENT_ID) return;

    const locale = this.i18n.getCurrentLanguage() === 'en' ? 'en' : 'es';
    const width = Math.max(Math.floor(this.wrap.nativeElement.clientWidth), 240);
    this.lastWidth = width;

    this.host.nativeElement.replaceChildren();

    if (forceInit || !this.initialized) {
      google.initialize({
        client_id: GOOGLE_OAUTH_CLIENT_ID,
        callback: (response) => {
          this.ngZone.run(() => this.credential.emit(response.credential));
        },
        auto_select: false,
      });
      this.initialized = true;
    }

    google.renderButton(this.host.nativeElement, {
      theme: this.variant === 'codex' ? 'filled_black' : 'outline',
      size: 'large',
      text: 'continue_with',
      shape: this.variant === 'codex' ? 'pill' : 'rectangular',
      logo_alignment: 'left',
      width,
      locale,
    });
  }
}
