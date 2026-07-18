import { AuditableEntity } from './base.model';

export interface Cliente extends AuditableEntity {
  schemaVersion?: number;
  nombreCompleto: string;
  celular: string;
  ci?: string;
}

export function normalizeCliente(cliente: Cliente): Cliente {
  return {
    ...cliente,
    ci: cliente.ci?.trim() || undefined,
    activo: cliente.activo ?? true,
  };
}
