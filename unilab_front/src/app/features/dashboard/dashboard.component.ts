import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div class="dashboard">
      <nav class="navbar">
        <div class="navbar-content">
          <h2>{{ 'dashboard.title' | translate }}</h2>
          <div class="user-info">
            <span *ngIf="currentUser">
              {{ 'dashboard.welcome' | translate }} {{ currentUser.email }}
            </span>
            <button (click)="logout()" class="btn-logout">{{ 'dashboard.logout' | translate }}</button>
          </div>
        </div>
      </nav>

      <div class="dashboard-content">
        <h1>{{ 'dashboard.heading' | translate }}</h1>
        <p>{{ 'dashboard.description' | translate }}</p>
        <p *ngIf="currentUser">
          {{ 'dashboard.roleLabel' | translate }} <strong>{{ currentUser.id_rol }}</strong>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      min-height: 100vh;
      background-color: #f5f5f5;
    }

    .navbar {
      background-color: #243b8e;
      color: white;
      padding: 16px 0;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .navbar-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .navbar h2 {
      margin: 0;
      font-size: 24px;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .btn-logout {
      background-color: #1c9dd8;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .btn-logout:hover {
      background-color: #157fb3;
    }

    .dashboard-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 32px 16px;
    }

    .dashboard-content h1 {
      color: #243b8e;
      margin-bottom: 16px;
    }

    .dashboard-content p {
      color: #666;
      line-height: 1.6;
    }
  `]
})
export class DashboardComponent implements OnInit {
  currentUser: any = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
    } else {
      this.currentUser = this.authService.getCurrentUser();
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
