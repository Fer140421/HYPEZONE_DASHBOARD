import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [MatCardModule, PageHeaderComponent],
  template: `
    <app-page-header
      title="Configuracion"
      description="Base preparada para datos de tienda, tenant y parametros comerciales."
    />

    <mat-card>
      <mat-card-content>
        <p class="muted">
          La estructura de datos ya incluye <strong>tenantId</strong> y <strong>storeId</strong> en lotes,
          productos y ventas para evolucionar hacia multi-tienda.
        </p>
      </mat-card-content>
    </mat-card>
  `,
})
export class ConfiguracionComponent {}
