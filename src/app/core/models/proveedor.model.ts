import { AuditableEntity } from './base.model';

export interface Proveedor extends AuditableEntity {
  schemaVersion?: number;
  nombreCompleto: string;
  direccion?: string;
  celular: string;
  categorias: string[];
  instagram?: string;
  tiktok?: string;
  detalles?: string;
}

export function normalizeProveedor(proveedor: Proveedor): Proveedor {
  return {
    ...proveedor,
    categorias: Array.isArray(proveedor.categorias)
      ? proveedor.categorias.filter((item): item is string => typeof item === 'string' && !!item.trim())
      : [],
    activo: proveedor.activo ?? true,
  };
}
