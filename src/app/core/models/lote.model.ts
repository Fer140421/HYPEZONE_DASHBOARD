import { AuditableEntity, FirestoreDate } from './base.model';

export interface Lote extends AuditableEntity {
  schemaVersion?: number;
  nombre: string;
  descripcion?: string;
  fechaCompra: FirestoreDate;
  proveedorId?: string;
  proveedor?: string;
  lugarCompra?: string;
  costoTotal: number;
  cantidadProductos?: number;
  notas?: string;
}

export function loteFechaCompra(value: FirestoreDate): Date {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? new Date() : date;
  }
  if (value && typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
    return value.toDate();
  }
  return new Date();
}

export const emptyLote: Omit<Lote, 'createdAt' | 'updatedAt'> = {
  nombre: '',
  descripcion: '',
  fechaCompra: new Date().toISOString().slice(0, 10),
  proveedorId: '',
  proveedor: '',
  lugarCompra: '',
  costoTotal: 0,
  cantidadProductos: 0,
  notas: '',
  activo: true,
};
