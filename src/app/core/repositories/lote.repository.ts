import { Injectable } from '@angular/core';
import { Lote } from '../models/lote.model';
import { FirestoreRepository } from './firestore.repository';

@Injectable({ providedIn: 'root' })
export class LoteRepository extends FirestoreRepository<Lote> {
  constructor() {
    super('lotes');
  }

  // hardDelete() is inherited for technical recovery only. Never expose it for lots with
  // product or historical-sale references; operational removal must remain a soft delete.
}
