import { AsyncPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { PageEvent, MatPaginatorModule } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BehaviorSubject, combineLatest, firstValueFrom, map, take } from 'rxjs';
import { marcasIniciales } from '../../../core/models/catalogo.model';
import { MarcaRepository } from '../../../core/repositories/marca.repository';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE_SIZE_OPTIONS,
  PaginationState,
  paginateItems,
} from '../../../shared/utils/pagination.util';

@Component({
  selector: 'app-marcas',
  standalone: true,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSnackBarModule,
    PageHeaderComponent,
  ],
  templateUrl: './marcas.html',
  styleUrl: './marcas.css',
})
export class MarcasComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly marcas = inject(MarcaRepository);
  private readonly snack = inject(MatSnackBar);
  private readonly pagination$ = new BehaviorSubject<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  readonly pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS;
  readonly marcas$ = this.marcas.getAll().pipe(map((items) => [...items].sort((a, b) => a.nombre.localeCompare(b.nombre))));
  readonly marcaForm = this.fb.nonNullable.group({ nombre: ['', Validators.required] });
  readonly listViewModel$ = combineLatest([this.marcas$, this.pagination$]).pipe(
    map(([marcas, pagination]) => ({ marcas: paginateItems(marcas, pagination) })),
  );

  ngOnInit(): void {
    void this.initializeCatalogs();
  }

  async addMarca(): Promise<void> {
    await this.add(this.marcaForm.getRawValue().nombre);
    this.marcaForm.reset();
  }

  async removeMarca(id: string): Promise<void> {
    await this.marcas.delete(id);
    this.message('Marca eliminada.');
  }

  updatePage(event: PageEvent): void {
    this.pagination$.next({ pageIndex: event.pageIndex, pageSize: event.pageSize });
  }

  private async initializeCatalogs(): Promise<void> {
    try {
      const marcas = await firstValueFrom(this.marcas.getAll(true).pipe(take(1)));
      if (!marcas.length) {
        await Promise.all(marcasIniciales.map((nombre) => this.marcas.create({ nombre })));
      }
    } catch {
      this.message('No se pudieron inicializar las marcas.');
    }
  }

  private async add(value: string): Promise<void> {
    const nombre = value.trim();
    if (!nombre) {
      return;
    }

    const items = await firstValueFrom(this.marcas.getAll(true).pipe(take(1)));
    if (items.some((item) => item.nombre.toLocaleLowerCase() === nombre.toLocaleLowerCase())) {
      this.message('Ese registro ya existe.');
      return;
    }

    await this.marcas.create({ nombre });
    this.message('Registro agregado.');
  }

  private message(text: string): void {
    this.snack.open(text, 'OK', { duration: 2500 });
  }
}
