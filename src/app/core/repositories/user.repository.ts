import { Injectable } from '@angular/core';
import { doc, docData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { UserProfile } from '../models/user-profile.model';
import { FirestoreRepository } from './firestore.repository';

@Injectable({ providedIn: 'root' })
export class UserRepository extends FirestoreRepository<UserProfile> {
  constructor() {
    super('users');
  }

  getProfile(uid: string): Observable<UserProfile | undefined> {
    return docData(doc(this.firestore, `users/${uid}`), { idField: 'id' }) as Observable<
      UserProfile | undefined
    >;
  }
}
