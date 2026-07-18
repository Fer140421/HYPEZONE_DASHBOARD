import { AuditableEntity } from './base.model';

export type MetodoPago = 'efectivo' | 'qr' | 'transferencia' | 'otro';

export interface Venta extends AuditableEntity {
  schemaVersion?: number;
  operacionId?: string;
  cantidadDetalles?: number;
  totalOperacion?: number;
  productoId: string;
  loteId?: string;
  nombreProducto: string;
  precioCompra: number;
  precioVenta: number;
  ganancia: number;
  clienteId?: string;
  clienteNombre?: string;
  clienteTelefono?: string;
  clienteCi?: string;
  metodoPago?: MetodoPago;
  fechaVenta: string;
  notas?: string;
}

export const metodosPago: MetodoPago[] = ['efectivo', 'qr', 'transferencia', 'otro'];
