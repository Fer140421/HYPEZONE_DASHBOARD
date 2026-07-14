export interface AuditableEntity {
  id?: string;
  tenantId?: string;
  storeId?: string;
  activo?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export type FirestoreDate = string | Date | unknown;
