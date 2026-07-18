import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Proveedor, normalizeProveedor } from '../models/proveedor.model';
import { FirestoreRepository } from './firestore.repository';

@Injectable({ providedIn: 'root' })
export class ProveedorRepository extends FirestoreRepository<Proveedor> {
  constructor() {
    super('proveedores');
  }

  override getAll(includeInactive = false): Observable<Proveedor[]> {
    return super
      .getAll(includeInactive)
      .pipe(map((items) => items.map((item) => normalizeProveedor(item))));
  }

  override getById(id: string): Observable<Proveedor | undefined> {
    return super.getById(id).pipe(map((item) => (item ? normalizeProveedor(item) : item)));
  }
}
