import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

/** Panel azul institucional compartido por /login y /registro. */
@Component({
  selector: 'app-auth-brand',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './auth-brand.component.html',
  styleUrl: './auth-brand.component.scss',
})
export class AuthBrandComponent {}
