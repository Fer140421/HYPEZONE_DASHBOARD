import { Injectable } from '@angular/core';
import { UserProfile } from '../models/user-profile.model';
import { FirestoreRepository } from './firestore.repository';

@Injectable({ providedIn: 'root' })
export class UserRepository extends FirestoreRepository<UserProfile> {
  constructor() {
    super('users');
  }
}
