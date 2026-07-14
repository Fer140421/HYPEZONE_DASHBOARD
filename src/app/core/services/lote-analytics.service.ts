import { Injectable } from '@angular/core';
import { Lote } from '../models/lote.model';
import { LoteResumen } from '../models/lote-resumen.model';
import { Producto } from '../models/producto.model';
import { Venta } from '../models/venta.model';

@Injectable({ providedIn: 'root' })
export class LoteAnalyticsService {
  getResumenLote(lote: Lote, productos: Producto[], ventas: Venta[]): LoteResumen {
    const productosLote = productos.filter(
      (producto) => producto.activo !== false && producto.loteId === lote.id,
    );
    const ventasLote = ventas.filter(
      (venta) => venta.activo !== false && venta.loteId === lote.id,
    );
    const costoTotal = this.number(lote.costoTotal);
    const ingresoReal = this.sum(ventasLote, (venta) => venta.precioVenta);

    return {
      lote,
      cantidadProductos: productosLote.length,
      cantidadDisponibles: productosLote.filter((p) => p.estado === 'disponible').length,
      cantidadReservados: productosLote.filter((p) => p.estado === 'reservado').length,
      cantidadVendidos: ventasLote.length,
      cantidadAgotados: productosLote.filter((p) => p.estado === 'agotado').length,
      inversionAsignada: this.sum(productosLote, (producto) => producto.precioCompra),
      valorEsperado: this.sum(
        productosLote,
        (producto) => producto.precioVenta ?? 0,
      ),
      ingresoReal,
      gananciaReal: this.sum(ventasLote, (venta) => venta.ganancia),
      recuperacionInversion: costoTotal > 0 ? (ingresoReal / costoTotal) * 100 : 0,
    };
  }

  getResumenesLotes(lotes: Lote[], productos: Producto[], ventas: Venta[]): LoteResumen[] {
    return lotes.map((lote) => this.getResumenLote(lote, productos, ventas));
  }

  private sum<T>(items: T[], selector: (item: T) => unknown): number {
    return items.reduce((total, item) => total + this.number(selector(item)), 0);
  }

  private number(value: unknown): number {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
