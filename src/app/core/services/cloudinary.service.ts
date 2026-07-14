import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { environment } from '../../../environments/environment';

interface CloudinaryUploadResponse {
  secure_url: string;
}

@Injectable({ providedIn: 'root' })
export class CloudinaryService {
  private readonly http = inject(HttpClient);
  private readonly allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  uploadImage(file: File): Observable<string> {
    if (!this.isValidImageType(file)) {
      throw new Error('Formato de imagen no permitido.');
    }

    const data = new FormData();
    data.append('file', file);
    data.append('upload_preset', environment.cloudinary.uploadPreset);

    return this.http
      .post<CloudinaryUploadResponse>(
        `https://api.cloudinary.com/v1_1/${environment.cloudinary.cloudName}/image/upload`,
        data,
      )
      .pipe(map((response) => response.secure_url));
  }

  uploadImages(files: File[]): Observable<string[]> {
    return forkJoin(files.map((file) => this.uploadImage(file)));
  }

  isValidImageType(file: File): boolean {
    return this.allowedTypes.includes(file.type);
  }
}
