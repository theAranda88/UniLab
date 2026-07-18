import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import type { UiVariant } from '../ui-variant';

export interface BreadcrumbItem {
  labelKey?: string;
  label?: string;
  route?: string | string[];
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss',
  host: {
    '[class.breadcrumb-host--portal]': 'variant === "portal"',
  },
})
export class BreadcrumbComponent {
  @Input({ required: true }) items: BreadcrumbItem[] = [];
  @Input() variant: UiVariant = 'default';
}
