import { Injectable } from '@angular/core';
import { Categoria } from '../models/catalogo.model';
import { FirestoreRepository } from './firestore.repository';

@Injectable({ providedIn: 'root' })
export class CategoriaRepository extends FirestoreRepository<Categoria> {
  constructor() { super('categorias'); }
}
