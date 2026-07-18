import { Injectable } from '@angular/core';
import { FirestoreRepository } from './firestore.repository';
import { Talla } from '../models/catalogo.model';

@Injectable({ providedIn: 'root' })
export class TallaRepository extends FirestoreRepository<Talla> {
  constructor() { super('tallas'); }
}
