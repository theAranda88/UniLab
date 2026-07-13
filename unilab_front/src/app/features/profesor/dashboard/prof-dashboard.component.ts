import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import {
  DASHBOARD_MOCK,
  DASHBOARD_PROF_RIGHT,
} from '../../../core/config/dashboard-mock-data';

@Component({
  selector: 'app-prof-dashboard',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './prof-dashboard.component.html',
  styleUrl: './prof-dashboard.component.scss',
})
export class ProfDashboardComponent {
  mock = DASHBOARD_MOCK.Profesor;
  right = DASHBOARD_PROF_RIGHT;
}
