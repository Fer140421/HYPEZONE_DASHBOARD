import { AsyncPipe, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { combineLatest, map } from 'rxjs';
import { precioCompraProducto, precioProducto } from '../../../core/models/producto.model';
import { ProductoRepository } from '../../../core/repositories/producto.repository';
import { VentaRepository } from '../../../core/repositories/venta.repository';
import { LoteRepository } from '../../../core/repositories/lote.repository';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusChipComponent } from '../../../shared/components/status-chip/status-chip.component';

@Component({
  selector: 'app-resumen',
  standalone: true,
  imports: [
    AsyncPipe,
    CurrencyPipe,
    DatePipe,
    MatCardModule,
    MatIconModule,
    MatListModule,
    PageHeaderComponent,
    StatusChipComponent,
  ],
  template: `
    <app-page-header
      title="Resumen"
      description="Lectura rapida del inventario, ventas y margen de la tienda."
    />

    @if (vm$ | async; as vm) {
      <section class="metric-grid">
        @for (card of vm.cards; track card.label) {
          <mat-card class="metric-card">
            <mat-icon>{{ card.icon }}</mat-icon>
            <span>{{ card.label }}</span>
            <strong>{{ card.currency ? (card.value | currency: 'BOB' : 'symbol-narrow') : card.value }}</strong>
          </mat-card>
        }
      </section>

      <section class="dashboard-grid">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Ultimas ventas</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-list>
              @for (venta of vm.ultimasVentas; track venta.id) {
                <mat-list-item>
                  <mat-icon matListItemIcon>receipt_long</mat-icon>
                  <div matListItemTitle>{{ venta.nombreProducto }}</div>
                  <div matListItemLine>
                    {{ venta.fechaVenta | date: 'mediumDate' }} ·
                    {{ venta.precioVenta | currency: 'BOB' : 'symbol-narrow' }}
                  </div>
                </mat-list-item>
              } @empty {
                <p class="muted padded">Aun no hay ventas registradas.</p>
              }
            </mat-list>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-card-title>Atencion de stock</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <mat-list>
              @for (producto of vm.alertasStock; track producto.id) {
                <mat-list-item>
                  <mat-icon matListItemIcon>warning</mat-icon>
                  <div matListItemTitle>{{ producto.nombre }}</div>
                  <div matListItemLine>
                    {{ producto.talla }} · <app-status-chip [status]="producto.estado" />
                  </div>
                </mat-list-item>
              } @empty {
                <p class="muted padded">Sin alertas por ahora.</p>
              }
            </mat-list>
          </mat-card-content>
        </mat-card>
      </section>
    }
  `,
})
export class ResumenComponent {
  private readonly productoRepository = inject(ProductoRepository);
  private readonly ventaRepository = inject(VentaRepository);
  private readonly loteRepository = inject(LoteRepository);

  readonly vm$ = combineLatest([
    this.productoRepository.getAll(true),
    this.ventaRepository.getAll(),
    this.loteRepository.getAll(),
  ]).pipe(
    map(([productos, ventas, lotes]) => {
      const activos = productos.filter((p) => p.activo !== false);
      const disponibles = activos.filter((p) => p.estado === 'disponible');
      const vendidos = activos.filter((p) => p.estado === 'vendido');
      const ventasActivas = ventas.filter((venta) => venta.activo !== false);
      const totalInvertido = activos.reduce((total, p) => total + precioCompraProducto(p), 0);
      const totalEsperado = activos.reduce((total, p) => total + precioProducto(p), 0);
      const totalVendido = ventasActivas.reduce((total, venta) => total + Number(venta.precioVenta), 0);
      const gananciaReal = ventasActivas.reduce((total, venta) => total + Number(venta.ganancia), 0);

      return {
        cards: [
          { label: 'Productos', value: activos.length, icon: 'inventory_2' },
          { label: 'Disponibles', value: disponibles.length, icon: 'sell' },
          { label: 'Vendidos', value: vendidos.length, icon: 'check_circle' },
          { label: 'Lotes activos', value: lotes.length, icon: 'local_shipping' },
          { label: 'Total invertido', value: totalInvertido, icon: 'payments', currency: true },
          { label: 'Venta esperada', value: totalEsperado, icon: 'trending_up', currency: true },
          { label: 'Total vendido', value: totalVendido, icon: 'point_of_sale', currency: true },
          {
            label: 'Ganancia estimada',
            value: totalEsperado - totalInvertido,
            icon: 'stacked_line_chart',
            currency: true,
          },
          { label: 'Ganancia real', value: gananciaReal, icon: 'paid', currency: true },
        ],
        ultimasVentas: [...ventasActivas].slice(0, 6),
        alertasStock: activos.filter((p) => ['vendido', 'agotado', 'reservado'].includes(p.estado)).slice(0, 6),
      };
    }),
  );
}
