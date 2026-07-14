import { inject } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  docData,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { Observable, map } from 'rxjs';
import { BaseRepository } from './base.repository';

/** Removes undefined recursively without altering Firestore sentinel values, Dates or Timestamps. */
export function removeUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => removeUndefinedDeep(item)) as T;
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .map(([key, item]) => [key, removeUndefinedDeep(item)]),
  ) as T;
}

export abstract class FirestoreRepository<T extends { id?: string; activo?: boolean; createdAt?: unknown }>
  implements BaseRepository<T>
{
  protected readonly firestore = inject(Firestore);

  protected constructor(protected readonly collectionName: string) {}

  getAll(includeInactive = false): Observable<T[]> {
    const ref = collection(this.firestore, this.collectionName);
    return (collectionData(ref, { idField: 'id' }) as Observable<T[]>).pipe(
      map((items) => {
        const filtered = includeInactive ? items : items.filter((item) => item.activo !== false);
        return this.sortByCreatedAtIfPresent(filtered);
      }),
    );
  }

  getById(id: string): Observable<T | undefined> {
    return docData(doc(this.firestore, `${this.collectionName}/${id}`), {
      idField: 'id',
    }) as Observable<T | undefined>;
  }

  getByProperty<K extends keyof T>(field: K, value: T[K]): Observable<T[]> {
    const ref = collection(this.firestore, this.collectionName);
    const q = query(ref, where(String(field), '==', value));
    return collectionData(q, { idField: 'id' }) as Observable<T[]>;
  }

  async create(item: Partial<T>): Promise<string> {
    const payload = removeUndefinedDeep({
      ...item,
      activo: item.activo ?? true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    const created = await addDoc(collection(this.firestore, this.collectionName), payload);
    return created.id;
  }

  update(id: string, item: Partial<T>): Promise<void> {
    return updateDoc(doc(this.firestore, `${this.collectionName}/${id}`), removeUndefinedDeep({
      ...item,
      updatedAt: serverTimestamp(),
    }) as never);
  }

  delete(id: string): Promise<void> {
    return this.update(id, { activo: false } as Partial<T>);
  }

  hardDelete(id: string): Promise<void> {
    return deleteDoc(doc(this.firestore, `${this.collectionName}/${id}`));
  }

  activate(id: string): Promise<void> {
    return this.update(id, { activo: true } as Partial<T>);
  }

  protected sum(items: T[], field: keyof T): number {
    return items.map((item) => Number(item[field] ?? 0)).reduce((total, value) => total + value, 0);
  }

  private sortByCreatedAtIfPresent(items: T[]): T[] {
    if (!items.some((item) => item.createdAt)) {
      return items;
    }

    return [...items].sort((a, b) => this.toMillis(b.createdAt) - this.toMillis(a.createdAt));
  }

  private toMillis(value: unknown): number {
    if (!value) {
      return 0;
    }

    if (value instanceof Date) {
      return value.getTime();
    }

    if (typeof value === 'string' || typeof value === 'number') {
      return new Date(value).getTime() || 0;
    }

    if (typeof value === 'object' && 'toMillis' in value && typeof value.toMillis === 'function') {
      return value.toMillis();
    }

    return 0;
  }
}
