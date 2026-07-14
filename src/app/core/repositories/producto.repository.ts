import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Producto, normalizeProducto } from '../models/producto.model';
import { FirestoreRepository } from './firestore.repository';

@Injectable({ providedIn: 'root' })
export class ProductoRepository extends FirestoreRepository<Producto> {
  constructor() {
    super('productos');
  }

  override getAll(includeInactive = false): Observable<Producto[]> {
    return super
      .getAll(includeInactive)
      .pipe(map((productos) => productos.map((producto) => normalizeProducto(producto))));
  }

  override getById(id: string): Observable<Producto | undefined> {
    return super.getById(id).pipe(map((producto) => (producto ? normalizeProducto(producto) : producto)));
  }

  getByLote(loteId: string): Observable<Producto[]> {
    return this.getAll().pipe(map((productos) => productos.filter((producto) => producto.loteId === loteId)));
  }

  getDisponibles(): Observable<Producto[]> {
    return this.getAll().pipe(map((productos) => productos.filter((p) => p.estado === 'disponible')));
  }

  cambiarEstado(id: string, estado: Producto['estado']): Promise<void> {
    return this.update(id, { estado });
  }

  cambiarPrecio(id: string, precioVenta: number): Promise<void> {
    return this.update(id, { precioVenta });
  }
}
