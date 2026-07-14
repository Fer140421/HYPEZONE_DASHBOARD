import { Injectable } from '@angular/core';
import { Marca } from '../models/catalogo.model';
import { FirestoreRepository } from './firestore.repository';

@Injectable({ providedIn: 'root' })
export class MarcaRepository extends FirestoreRepository<Marca> {
  constructor() { super('marcas'); }
}
