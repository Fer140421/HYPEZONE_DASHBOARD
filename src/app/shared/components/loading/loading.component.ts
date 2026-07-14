import { Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="loading-state">
      <mat-spinner [diameter]="diameter()" />
      <span>{{ text() }}</span>
    </div>
  `,
})
export class LoadingComponent {
  readonly text = input('Cargando...');
  readonly diameter = input(34);
}
