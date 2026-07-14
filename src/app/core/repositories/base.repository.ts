import { Observable } from 'rxjs';

export abstract class BaseRepository<T extends { id?: string }> {
  abstract getAll(includeInactive?: boolean): Observable<T[]>;
  abstract getById(id: string): Observable<T | undefined>;
  abstract getByProperty<K extends keyof T>(field: K, value: T[K]): Observable<T[]>;
  abstract create(item: Partial<T>): Promise<string>;
  abstract update(id: string, item: Partial<T>): Promise<void>;
  abstract delete(id: string): Promise<void>;
  abstract hardDelete(id: string): Promise<void>;
  abstract activate(id: string): Promise<void>;
}
