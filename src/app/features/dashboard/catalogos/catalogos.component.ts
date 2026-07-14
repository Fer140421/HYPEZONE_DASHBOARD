import { AsyncPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { firstValueFrom, take } from 'rxjs';
import { categoriasIniciales, marcasIniciales } from '../../../core/models/catalogo.model';
import { CategoriaRepository } from '../../../core/repositories/categoria.repository';
import { MarcaRepository } from '../../../core/repositories/marca.repository';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-catalogos', standalone: true,
  imports: [AsyncPipe, ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSnackBarModule, PageHeaderComponent],
  template: `
    <app-page-header title="Categorías y marcas" description="Catálogos disponibles para organizar los productos." />
    <section class="detail-grid">
      <mat-card><mat-card-header><mat-card-title>Categorías</mat-card-title></mat-card-header><mat-card-content>
        <form class="inline-form" [formGroup]="categoriaForm" (ngSubmit)="addCategoria()">
          <mat-form-field appearance="outline"><mat-label>Nueva categoría</mat-label><input matInput formControlName="nombre" /></mat-form-field>
          <button mat-flat-button class="primary-action" type="submit" [disabled]="categoriaForm.invalid">Agregar</button>
        </form>
        <div class="catalog-list">@for (item of categorias$ | async; track item.id) { <div><span>{{ item.nombre }}</span><button mat-icon-button color="warn" type="button" (click)="removeCategoria(item.id!)" aria-label="Eliminar categoría"><mat-icon>delete</mat-icon></button></div> }</div>
      </mat-card-content></mat-card>
      <mat-card><mat-card-header><mat-card-title>Marcas</mat-card-title></mat-card-header><mat-card-content>
        <form class="inline-form" [formGroup]="marcaForm" (ngSubmit)="addMarca()">
          <mat-form-field appearance="outline"><mat-label>Nueva marca</mat-label><input matInput formControlName="nombre" /></mat-form-field>
          <button mat-flat-button class="primary-action" type="submit" [disabled]="marcaForm.invalid">Agregar</button>
        </form>
        <div class="catalog-list">@for (item of marcas$ | async; track item.id) { <div><span>{{ item.nombre }}</span><button mat-icon-button color="warn" type="button" (click)="removeMarca(item.id!)" aria-label="Eliminar marca"><mat-icon>delete</mat-icon></button></div> }</div>
      </mat-card-content></mat-card>
    </section>
  `,
  styles: `.inline-form{display:flex;gap:12px;align-items:center}.inline-form mat-form-field{flex:1}.catalog-list>div{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--mat-sys-outline-variant);padding:6px 0}`,
})
export class CatalogosComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly categorias = inject(CategoriaRepository);
  private readonly marcas = inject(MarcaRepository);
  private readonly snack = inject(MatSnackBar);
  readonly categorias$ = this.categorias.getAll();
  readonly marcas$ = this.marcas.getAll();
  readonly categoriaForm = this.fb.nonNullable.group({ nombre: ['', Validators.required] });
  readonly marcaForm = this.fb.nonNullable.group({ nombre: ['', Validators.required] });

  ngOnInit(): void { void this.initializeCatalogs(); }
  async addCategoria(): Promise<void> { await this.add(this.categorias, this.categoriaForm.getRawValue().nombre); this.categoriaForm.reset(); }
  async addMarca(): Promise<void> { await this.add(this.marcas, this.marcaForm.getRawValue().nombre); this.marcaForm.reset(); }
  async removeCategoria(id: string): Promise<void> { await this.categorias.delete(id); this.message('Categoría eliminada.'); }
  async removeMarca(id: string): Promise<void> { await this.marcas.delete(id); this.message('Marca eliminada.'); }

  private async initializeCatalogs(): Promise<void> {
    try {
      const [categorias, marcas] = await Promise.all([firstValueFrom(this.categorias.getAll(true).pipe(take(1))), firstValueFrom(this.marcas.getAll(true).pipe(take(1)))]);
      if (!categorias.length) await Promise.all(categoriasIniciales.map((nombre) => this.categorias.create({ nombre })));
      if (!marcas.length) await Promise.all(marcasIniciales.map((nombre) => this.marcas.create({ nombre })));
    } catch { this.message('No se pudieron inicializar los catálogos.'); }
  }
  private async add(repository: CategoriaRepository | MarcaRepository, value: string): Promise<void> {
    const nombre = value.trim(); if (!nombre) return;
    const items = await firstValueFrom(repository.getAll(true).pipe(take(1)));
    if (items.some((item) => item.nombre.toLocaleLowerCase() === nombre.toLocaleLowerCase())) { this.message('Ese registro ya existe.'); return; }
    await repository.create({ nombre }); this.message('Registro agregado.');
  }
  private message(text: string): void { this.snack.open(text, 'OK', { duration: 2500 }); }
}
