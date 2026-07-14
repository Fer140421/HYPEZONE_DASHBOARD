import { Component, EventEmitter, Output, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CloudinaryService } from '../../../core/services/cloudinary.service';

@Component({
  selector: 'app-image-uploader',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div class="image-uploader">
      <label class="upload-dropzone">
        <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" [multiple]="maxImages() > 1" (change)="onSelect($event)" />
        <mat-icon>cloud_upload</mat-icon>
        <span>{{ uploading() ? 'Subiendo imagenes...' : 'Subir imagenes' }}</span>
      </label>

      @if (images().length) {
        <div class="image-grid">
          @for (image of images(); track image) {
            <img [src]="image" alt="Imagen del producto" />
          }
        </div>
      }
    </div>
  `,
})
export class ImageUploaderComponent {
  readonly images = input<string[]>([]);
  readonly maxImages = input(Number.MAX_SAFE_INTEGER);
  readonly uploading = signal(false);

  @Output() uploaded = new EventEmitter<string[]>();
  @Output() error = new EventEmitter<string>();

  constructor(private readonly cloudinaryService: CloudinaryService) {}

  onSelect(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const remaining = Math.max(0, this.maxImages() - this.images().length);
    const files = Array.from(inputElement.files ?? []).slice(0, remaining);
    const invalid = files.find((file) => !this.cloudinaryService.isValidImageType(file));

    if (invalid) {
      this.error.emit('Solo se permiten imagenes JPG, PNG o WEBP.');
      inputElement.value = '';
      return;
    }

    if (!files.length) {
      return;
    }

    this.uploading.set(true);
    this.cloudinaryService.uploadImages(files).subscribe({
      next: (urls) => this.uploaded.emit([...this.images(), ...urls].slice(0, this.maxImages())),
      error: () => this.error.emit('No se pudieron subir las imagenes.'),
      complete: () => {
        this.uploading.set(false);
        inputElement.value = '';
      },
    });
  }
}
