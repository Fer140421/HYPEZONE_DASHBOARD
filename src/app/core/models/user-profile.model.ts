import { AuditableEntity } from './base.model';

export type UserRole = 'owner' | 'admin' | 'seller';

export interface UserProfile extends AuditableEntity {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  active: boolean;
}
