import { Component, computed, input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-status-chip',
  standalone: true,
  imports: [MatChipsModule],
  template: `<mat-chip class="status-chip" [class]="tone()">{{ label() }}</mat-chip>`,
})
export class StatusChipComponent {
  readonly status = input.required<string>();
  readonly label = computed(() => this.status().replace('_', ' '));
  readonly tone = computed(() => `status-${this.status()}`);
}
