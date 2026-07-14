import { Injectable } from '@angular/core';
import { Venta } from '../models/venta.model';
import { FirestoreRepository } from './firestore.repository';

@Injectable({ providedIn: 'root' })
export class VentaRepository extends FirestoreRepository<Venta> {
  constructor() {
    super('ventas');
  }
}
