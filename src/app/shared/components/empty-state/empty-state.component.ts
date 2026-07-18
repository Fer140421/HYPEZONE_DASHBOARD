import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.css',
})
export class EmptyStateComponent {
  readonly icon = input('inventory_2');
  readonly title = input('Sin datos');
  readonly description = input('Cuando existan registros, apareceran aqui.');
}
