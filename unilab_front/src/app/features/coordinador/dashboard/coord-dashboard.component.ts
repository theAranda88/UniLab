import { Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import {
  DASHBOARD_COORD_RIGHT,
  DASHBOARD_MOCK,
} from '../../../core/config/dashboard-mock-data';

@Component({
  selector: 'app-coord-dashboard',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './coord-dashboard.component.html',
  styleUrl: './coord-dashboard.component.scss',
})
export class CoordDashboardComponent {
  mock = DASHBOARD_MOCK.Coordinador;
  right = DASHBOARD_COORD_RIGHT;
}
