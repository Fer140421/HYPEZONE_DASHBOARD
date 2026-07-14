import { AuditableEntity } from './base.model';

export interface UserProfile extends AuditableEntity {
  uid: string;
  email: string;
  nombre?: string;
  rol?: 'owner' | 'admin' | 'vendedor';
}
