import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Cliente, normalizeCliente } from '../models/cliente.model';
import { FirestoreRepository } from './firestore.repository';

@Injectable({ providedIn: 'root' })
export class ClienteRepository extends FirestoreRepository<Cliente> {
  constructor() {
    super('clientes');
  }

  override getAll(includeInactive = false): Observable<Cliente[]> {
    return super
      .getAll(includeInactive)
      .pipe(map((items) => items.map((item) => normalizeCliente(item))));
  }

  override getById(id: string): Observable<Cliente | undefined> {
    return super.getById(id).pipe(map((item) => (item ? normalizeCliente(item) : item)));
  }
}
