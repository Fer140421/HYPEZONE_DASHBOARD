import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="empty-state">
      <mat-icon>{{ icon() }}</mat-icon>
      <h3>{{ title() }}</h3>
      <p>{{ description() }}</p>
      <ng-content />
    </div>
  `,
})
export class EmptyStateComponent {
  readonly icon = input('inventory_2');
  readonly title = input('Sin datos');
  readonly description = input('Cuando existan registros, apareceran aqui.');
}
