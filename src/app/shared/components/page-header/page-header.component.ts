import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <section class="page-header">
      <div>
        <p class="eyebrow">{{ eyebrow() }}</p>
        <h1>{{ title() }}</h1>
        @if (description()) {
          <p class="muted">{{ description() }}</p>
        }
      </div>
      <ng-content />
    </section>
  `,
})
export class PageHeaderComponent {
  readonly eyebrow = input('Hypezone');
  readonly title = input.required<string>();
  readonly description = input('');
}
