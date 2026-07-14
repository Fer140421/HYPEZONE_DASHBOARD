import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, combineLatest, of, startWith, switchMap, map } from 'rxjs';
import { Lote } from '../../../core/models/lote.model';
import {
  Producto,
  categoriasProducto,
  estadosProducto,
  generosProducto,
  GeneroProducto,
  imagenesProducto,
  precioCompraProducto,
  precioProducto,
} from '../../../core/models/producto.model';
import { metodosPago } from '../../../core/models/venta.model';
import { LoteRepository } from '../../../core/repositories/lote.repository';
import { ProductoRepository } from '../../../core/repositories/producto.repository';
import { CategoriaRepository } from '../../../core/repositories/categoria.repository';
import { MarcaRepository } from '../../../core/repositories/marca.repository';
import { VentaService } from '../../../core/services/venta.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ImageUploaderComponent } from '../../../shared/components/image-uploader/image-uploader.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusChipComponent } from '../../../shared/components/status-chip/status-chip.component';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [
    AsyncPipe,
    CurrencyPipe,
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
    MatSnackBarModule,
    MatSortModule,
    MatTableModule,
    ImageUploaderComponent,
    PageHeaderComponent,
    StatusChipComponent,
  ],
  template: `
    @if (mode() === 'list') {
      <app-page-header title="Productos" description="Inventario completo con filtros.">
        <button mat-flat-button class="primary-action" routerLink="/dashboard/productos/nuevo">
          <mat-icon>add</mat-icon>
          Nuevo producto
        </button>
      </app-page-header>

      <mat-card>
        <form class="filters" [formGroup]="filters">
          <mat-form-field appearance="outline">
            <mat-label>Buscar</mat-label>
            <input matInput formControlName="search" placeholder="Nombre o marca" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Categoria</mat-label>
            <mat-select formControlName="categoria">
              <mat-option value="">Todas</mat-option>
              @for (categoria of categorias; track categoria) {
                <mat-option [value]="categoria">{{ categoria }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Talla</mat-label>
            <input matInput formControlName="talla" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Estado</mat-label>
            <mat-select formControlName="estado">
              <mat-option value="">Todos</mat-option>
              @for (estado of estados; track estado) {
                <mat-option [value]="estado">{{ estado }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Lote</mat-label>
            <mat-select formControlName="loteId">
              <mat-option value="">Todos</mat-option>
              @for (lote of lotes$ | async; track lote.id) {
                <mat-option [value]="lote.id">{{ lote.nombre }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </form>

        <table mat-table matSort [dataSource]="(productosFiltrados$ | async) ?? []" class="product-table">
          <ng-container matColumnDef="imagen">
            <th mat-header-cell *matHeaderCellDef>Foto</th>
            <td mat-cell *matCellDef="let producto">
              @if (firstImage(producto); as image) {
                <img class="product-thumb" [src]="image" [alt]="producto.nombre" />
              } @else {
                <div class="product-thumb placeholder">
                  <mat-icon>image</mat-icon>
                </div>
              }
            </td>
          </ng-container>

          <ng-container matColumnDef="nombre">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Producto</th>
            <td mat-cell *matCellDef="let producto">
              <strong>{{ producto.nombre }}</strong>
            </td>
          </ng-container>

          <ng-container matColumnDef="talla">
            <th mat-header-cell *matHeaderCellDef>Talla</th>
            <td mat-cell *matCellDef="let producto">{{ producto.talla }}</td>
          </ng-container>

          <ng-container matColumnDef="precioVenta">
            <th mat-header-cell *matHeaderCellDef>Venta</th>
            <td mat-cell *matCellDef="let producto">
              <div class="price-cell">
                <span>{{ precio(producto) | currency: 'BOB' : 'symbol-narrow' }}</span>
                <button mat-icon-button type="button" (click)="openPriceEdit(producto)" aria-label="Editar precio">
                  <mat-icon>edit</mat-icon>
                </button>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="estado">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let producto"><app-status-chip [status]="producto.estado" /></td>
          </ng-container>

          <ng-container matColumnDef="acciones">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let producto" class="table-actions">
              <button mat-icon-button type="button" (click)="openView(producto)" aria-label="Ver producto">
                <mat-icon>visibility</mat-icon>
              </button>
              <button mat-icon-button (click)="openEdit(producto)" aria-label="Editar producto">
                <mat-icon>edit</mat-icon>
              </button>
              @if (producto.activo !== false) {
                <button mat-icon-button color="warn" (click)="softDelete(producto)" aria-label="Eliminar producto">
                  <mat-icon>delete</mat-icon>
                </button>
              } @else {
                <button mat-icon-button color="primary" (click)="confirmRestore(producto)" aria-label="Restaurar producto">
                  <mat-icon>restore</mat-icon>
                </button>
              }
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
        </table>
        <mat-paginator [pageSize]="10" [pageSizeOptions]="[10, 25, 50]" />
      </mat-card>
    } @else {
      <app-page-header [title]="mode() === 'new' ? 'Nuevo producto' : 'Detalle de producto'">
        <button mat-button routerLink="/dashboard/productos">Volver</button>
      </app-page-header>

      <section class="detail-grid wide">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Ficha del producto</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form class="form-grid" [formGroup]="form" (ngSubmit)="save()">
              <mat-form-field appearance="outline">
                <mat-label>Nombre</mat-label>
                <input matInput formControlName="nombre" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Marca</mat-label>
                <mat-select formControlName="marca"><mat-option value="">Sin definir</mat-option>@for (marca of marcas$ | async; track marca.id) { <mat-option [value]="marca.nombre">{{ marca.nombre }}</mat-option> }</mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Categoria</mat-label>
                <mat-select formControlName="categoria">
                  @for (categoria of categorias$ | async; track categoria.id) {
                    <mat-option [value]="categoria.nombre">{{ categoria.nombre }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Lote</mat-label>
                <mat-select formControlName="loteId">
                  <mat-option value="">Sin lote</mat-option>
                  @for (lote of lotes$ | async; track lote.id) {
                    <mat-option [value]="lote.id">{{ lote.nombre }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Talla</mat-label>
                <input matInput formControlName="talla" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Color</mat-label>
                <input matInput formControlName="color" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Genero</mat-label>
                <mat-select formControlName="genero">
                  <mat-option value="">Sin definir</mat-option>
                  @for (genero of generos; track genero) {
                    <mat-option [value]="genero">{{ genero }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Estado</mat-label>
                <mat-select formControlName="estado">
                  @for (estado of estados; track estado) {
                    <mat-option [value]="estado">{{ estado }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Precio compra</mat-label>
                <input matInput type="number" formControlName="precioCompra" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Precio venta</mat-label>
                <input matInput type="number" formControlName="precioVenta" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Precio oferta</mat-label>
                <input matInput type="number" formControlName="precioOferta" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Codigo</mat-label>
                <input matInput formControlName="codigo" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="full">
                <mat-label>Descripcion</mat-label>
                <textarea matInput rows="3" formControlName="descripcion"></textarea>
              </mat-form-field>
              <mat-form-field appearance="outline" class="full">
                <mat-label>Notas</mat-label>
                <textarea matInput rows="3" formControlName="notas"></textarea>
              </mat-form-field>

              <div class="full">
                <app-image-uploader
                  [images]="imagenes()"
                  (uploaded)="imagenes.set($event)"
                  (error)="snack($event)"
                />
              </div>

              <button mat-flat-button class="primary-action" type="submit" [disabled]="form.invalid">
                Guardar producto
              </button>
            </form>
          </mat-card-content>
        </mat-card>

        @if (mode() === 'detail' && currentProducto()) {
          <mat-card>
            <mat-card-header>
              <mat-card-title>Registrar venta</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form class="form-grid compact" [formGroup]="ventaForm" (ngSubmit)="registrarVenta()">
                <mat-form-field appearance="outline">
                  <mat-label>Precio final</mat-label>
                  <input matInput type="number" formControlName="precioVenta" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Metodo de pago</mat-label>
                  <mat-select formControlName="metodoPago">
                    @for (metodo of metodos; track metodo) {
                      <mat-option [value]="metodo">{{ metodo }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Cliente</mat-label>
                  <input matInput formControlName="clienteNombre" />
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Telefono</mat-label>
                  <input matInput formControlName="clienteTelefono" />
                </mat-form-field>
                <mat-form-field appearance="outline" class="full">
                  <mat-label>Notas</mat-label>
                  <textarea matInput rows="2" formControlName="notas"></textarea>
                </mat-form-field>
                <button
                  mat-flat-button
                  color="accent"
                  type="submit"
                  [disabled]="ventaForm.invalid || procesandoVenta()"
                >
                  {{ procesandoVenta() ? 'Registrando...' : 'Marcar como vendido' }}
                </button>
              </form>
            </mat-card-content>
          </mat-card>
        }
      </section>
    }
  `,
})
export class ProductosComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly productoRepository = inject(ProductoRepository);
  private readonly loteRepository = inject(LoteRepository);
  private readonly ventaService = inject(VentaService);
  private readonly categoriaRepository = inject(CategoriaRepository);
  private readonly marcaRepository = inject(MarcaRepository);

  readonly categorias = categoriasProducto;
  readonly categorias$ = this.categoriaRepository.getAll();
  readonly marcas$ = this.marcaRepository.getAll();
  readonly estados = estadosProducto;
  readonly generos = generosProducto;
  readonly metodos = metodosPago;
  readonly columns = ['imagen', 'nombre', 'talla', 'precioVenta', 'estado', 'acciones'];
  readonly mode = signal<'list' | 'new' | 'detail'>('list');
  readonly currentId = signal<string | null>(null);
  readonly currentProducto = signal<Producto | null>(null);
  readonly imagenes = signal<string[]>([]);
  readonly procesandoVenta = signal(false);

  readonly lotes$ = this.loteRepository.getAll();
  readonly filters = this.fb.nonNullable.group({
    search: [''],
    categoria: [''],
    talla: [''],
    estado: ['disponible'],
    loteId: [''],
  });

  readonly productosFiltrados$ = combineLatest([
    this.productoRepository.getAll(true),
    this.filters.valueChanges.pipe(startWith(this.filters.getRawValue())),
  ]).pipe(
    map(([productos, filters]) => {
      const search = (filters.search ?? '').toLowerCase().trim();
      return productos.filter((producto) => {
        const matchesSearch =
          !search ||
          producto.nombre.toLowerCase().includes(search) ||
          (producto.marca ?? '').toLowerCase().includes(search);
        return (
          matchesSearch &&
          (!filters.categoria || producto.categoria === filters.categoria) &&
          (!filters.talla || producto.talla.toLowerCase().includes(filters.talla.toLowerCase())) &&
          (!filters.estado || producto.estado === filters.estado) &&
          (!filters.loteId || producto.loteId === filters.loteId)
        );
      });
    }),
  );

  readonly form = this.fb.nonNullable.group({
    loteId: [''],
    nombre: ['', Validators.required],
    marca: [''],
    categoria: ['otro', Validators.required],
    descripcion: ['', Validators.required],
    talla: ['', Validators.required],
    color: [''],
    genero: [''],
    precioCompra: [0, [Validators.required, Validators.min(0)]],
    precioVenta: [0, [Validators.required, Validators.min(0)]],
    precioOferta: this.fb.control<number | null>(null),
    estado: ['disponible', Validators.required],
    codigo: [''],
    notas: [''],
  });

  readonly ventaForm = this.fb.nonNullable.group({
    precioVenta: [0, [Validators.required, Validators.min(0)]],
    metodoPago: ['efectivo', Validators.required],
    clienteNombre: [''],
    clienteTelefono: [''],
    notas: [''],
  });

  ngOnInit(): void {
    this.route.url.subscribe((segments) => {
      const isNew = segments.some((segment) => segment.path === 'nuevo');
      this.mode.set(isNew ? 'new' : this.route.snapshot.paramMap.has('id') ? 'detail' : 'list');
    });

    this.route.paramMap
      .pipe(switchMap((params) => (params.get('id') ? this.productoRepository.getById(params.get('id')!) : of(null))))
      .subscribe((producto) => {
        this.currentProducto.set(producto ?? null);
        this.currentId.set(producto?.id ?? null);

        if (!producto) {
          if (this.mode() === 'new') {
            this.form.reset({
              loteId: this.route.snapshot.queryParamMap.get('loteId') ?? '',
              nombre: '',
              marca: '',
              categoria: 'otro',
              descripcion: '',
              talla: '',
              color: '',
              genero: '',
              precioCompra: 0,
              precioVenta: 0,
              precioOferta: null,
              estado: 'disponible',
              codigo: '',
              notas: '',
            });
            this.imagenes.set([]);
          }
          return;
        }

        this.form.patchValue({
          loteId: producto.loteId ?? '',
          nombre: producto.nombre,
          marca: producto.marca ?? '',
          categoria: producto.categoria ?? 'otro',
          descripcion: producto.descripcion,
          talla: producto.talla,
          color: producto.color ?? '',
          genero: producto.genero ?? '',
          precioCompra: precioCompraProducto(producto),
          precioVenta: precioProducto(producto),
          precioOferta: producto.precioOferta ?? null,
          estado: producto.estado,
          codigo: producto.codigo ?? '',
          notas: producto.notas ?? '',
        });
        this.imagenes.set(imagenesProducto(producto));
        this.ventaForm.patchValue({ precioVenta: Number(producto.precioOferta ?? precioProducto(producto)) });
      });
  }

  precio(producto: Producto): number {
    return precioProducto(producto);
  }

  precioCompra(producto: Producto): number {
    return precioCompraProducto(producto);
  }

  firstImage(producto: Producto): string {
    return imagenesProducto(producto)[0] ?? '';
  }

  openView(producto: Producto): void {
    this.dialog.open(ProductViewDialogComponent, {
      width: 'min(760px, 96vw)',
      maxHeight: '92vh',
      data: {
        producto,
      },
    });
  }

  openEdit(producto: Producto): void {
    if (!producto.id) {
      return;
    }

    const dialogRef = this.dialog.open(ProductEditDialogComponent, {
      width: 'min(920px, 96vw)',
      maxHeight: '92vh',
      data: {
        producto,
        lotes$: this.lotes$,
      },
    });

    dialogRef.afterClosed().subscribe(async (payload?: Partial<Producto>) => {
      if (!payload || !producto.id) {
        return;
      }
      await this.productoRepository.update(producto.id, payload);
      this.snack('Producto actualizado.');
    });
  }

  async save(): Promise<void> {
    const raw = this.form.getRawValue();
    const { precioOferta, ...productValues } = raw;
    const payload: Partial<Producto> = {
      ...productValues,
      loteId: raw.loteId || undefined,
      genero: (raw.genero || undefined) as GeneroProducto | undefined,
      ...(precioOferta === null ? {} : { precioOferta }),
      imagenes: this.imagenes(),
      activo: true,
    } as Partial<Producto>;

    if (this.currentId()) {
      await this.productoRepository.update(this.currentId()!, payload);
      this.snack('Producto actualizado.');
      await this.router.navigate(['/dashboard/productos']);
      return;
    }

    await this.productoRepository.create(payload);
    this.snack('Producto creado.');
    await this.router.navigate(['/dashboard/productos']);
  }

  openPriceEdit(producto: Producto): void {
    if (!producto.id) {
      return;
    }

    const dialogRef = this.dialog.open(ProductPriceDialogComponent, {
      width: 'min(420px, 92vw)',
      data: {
        producto,
      },
    });

    dialogRef.afterClosed().subscribe(async (precioVenta: unknown) => {
      if (typeof precioVenta !== 'number' || !Number.isFinite(precioVenta) || !producto.id) {
        return;
      }
      await this.productoRepository.cambiarPrecio(producto.id, precioVenta);
      this.snack('Precio actualizado.');
    });
  }

  softDelete(producto: Producto): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Eliminar producto',
        message: `Se ocultara "${producto.nombre}" sin borrarlo fisicamente.`,
        confirmText: 'Eliminar',
      },
    });

    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (confirmed && producto.id) {
        await this.productoRepository.delete(producto.id);
        this.snack('Producto eliminado logicamente.');
      }
    });
  }

  async restore(producto: Producto): Promise<void> {
    if (!producto.id) {
      return;
    }
    await this.productoRepository.activate(producto.id);
    this.snack('Producto restaurado.');
  }

  confirmRestore(producto: Producto): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Restaurar producto',
        message: `El producto "${producto.nombre}" volvera a aparecer como activo.`,
        confirmText: 'Restaurar',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        void this.restore(producto);
      }
    });
  }

  async registrarVenta(): Promise<void> {
    const producto = this.currentProducto();
    if (!producto || this.ventaForm.invalid || this.procesandoVenta()) {
      return;
    }

    const raw = this.ventaForm.getRawValue();
    this.procesandoVenta.set(true);
    try {
      await this.ventaService.registrarVenta(producto, {
        ...raw,
        fechaVenta: new Date().toISOString(),
        metodoPago: raw.metodoPago as never,
      });
      this.snack('Venta registrada correctamente.');
      await this.router.navigate(['/dashboard/ventas']);
    } catch (error) {
      this.snack(this.ventaErrorMessage(error));
    } finally {
      this.procesandoVenta.set(false);
    }
  }

  private ventaErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'No se pudo registrar la venta.';
  }

  snack(message: string): void {
    this.snackBar.open(message, 'OK', { duration: 2500 });
  }
}

interface ProductEditDialogData {
  producto: Producto;
  lotes$: Observable<Lote[]>;
}

interface ProductViewDialogData {
  producto: Producto;
}

interface ProductPriceDialogData {
  producto: Producto;
}

@Component({
  selector: 'app-product-view-dialog',
  standalone: true,
  imports: [CurrencyPipe, MatButtonModule, MatDialogModule, StatusChipComponent],
  template: `
    <h2 mat-dialog-title>{{ data.producto.nombre }}</h2>
    <mat-dialog-content>
      <section class="product-view">
        <div class="product-view-gallery">
          @if (imagenes.length) {
            @for (image of imagenes; track image) {
              <img [src]="image" [alt]="data.producto.nombre" />
            }
          } @else {
            <div class="product-view-placeholder">Sin foto</div>
          }
        </div>

        <div class="product-view-details">
          <app-status-chip [status]="data.producto.estado" />
          <dl>
            <div>
              <dt>Talla</dt>
              <dd>{{ data.producto.talla }}</dd>
            </div>
            <div>
              <dt>Precio venta</dt>
              <dd>{{ precioVenta | currency: 'BOB' : 'symbol-narrow' }}</dd>
            </div>
            <div>
              <dt>Precio compra</dt>
              <dd>{{ precioCompra | currency: 'BOB' : 'symbol-narrow' }}</dd>
            </div>
            @if (data.producto.precioOferta !== undefined) {
              <div>
                <dt>Precio oferta</dt>
                <dd>{{ data.producto.precioOferta | currency: 'BOB' : 'symbol-narrow' }}</dd>
              </div>
            }
            <div>
              <dt>Categoria</dt>
              <dd>{{ data.producto.categoria || 'Sin categoria' }}</dd>
            </div>
            <div>
              <dt>Marca</dt>
              <dd>{{ data.producto.marca || 'Sin marca' }}</dd>
            </div>
            <div>
              <dt>Color</dt>
              <dd>{{ data.producto.color || 'Sin color' }}</dd>
            </div>
            <div>
              <dt>Genero</dt>
              <dd>{{ data.producto.genero || 'Sin definir' }}</dd>
            </div>
            <div>
              <dt>Codigo</dt>
              <dd>{{ data.producto.codigo || 'Sin codigo' }}</dd>
            </div>
            <div class="full">
              <dt>Descripcion</dt>
              <dd>{{ data.producto.descripcion || 'Sin descripcion' }}</dd>
            </div>
            @if (data.producto.notas) {
              <div class="full">
                <dt>Notas</dt>
                <dd>{{ data.producto.notas }}</dd>
              </div>
            }
          </dl>
        </div>
      </section>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-flat-button class="primary-action" type="button" mat-dialog-close>Cerrar</button>
    </mat-dialog-actions>
  `,
})
export class ProductViewDialogComponent {
  readonly data = inject<ProductViewDialogData>(MAT_DIALOG_DATA);
  readonly imagenes = imagenesProducto(this.data.producto);
  readonly precioVenta = precioProducto(this.data.producto);
  readonly precioCompra = precioCompraProducto(this.data.producto);
}

@Component({
  selector: 'app-product-price-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule],
  template: `
    <h2 mat-dialog-title>Editar precio</h2>
    <mat-dialog-content>
      <form class="form-grid compact" [formGroup]="form">
        <mat-form-field appearance="outline">
          <mat-label>Precio de venta</mat-label>
          <input matInput type="number" formControlName="precioVenta" />
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="cancel()">Cancelar</button>
      <button mat-flat-button class="primary-action" type="button" [disabled]="form.invalid" (click)="save()">
        Guardar precio
      </button>
    </mat-dialog-actions>
  `,
})
export class ProductPriceDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ProductPriceDialogComponent>);
  readonly data = inject<ProductPriceDialogData>(MAT_DIALOG_DATA);

  readonly form = this.fb.nonNullable.group({
    precioVenta: [precioProducto(this.data.producto), [Validators.required, Validators.min(0)]],
  });

  save(): void {
    if (this.form.invalid) {
      return;
    }

    this.dialogRef.close(Number(this.form.getRawValue().precioVenta));
  }

  cancel(): void {
    this.dialogRef.close();
  }
}

@Component({
  selector: 'app-product-edit-dialog',
  standalone: true,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    ImageUploaderComponent,
  ],
  template: `
    <h2 mat-dialog-title>Editar producto</h2>
    <mat-dialog-content>
      <form class="form-grid dialog-form" [formGroup]="form">
        <mat-form-field appearance="outline">
          <mat-label>Nombre</mat-label>
          <input matInput formControlName="nombre" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Marca</mat-label>
          <input matInput formControlName="marca" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Categoria</mat-label>
          <mat-select formControlName="categoria">
            @for (categoria of categorias; track categoria) {
              <mat-option [value]="categoria">{{ categoria }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Lote</mat-label>
          <mat-select formControlName="loteId">
            <mat-option value="">Sin lote</mat-option>
            @for (lote of data.lotes$ | async; track lote.id) {
              <mat-option [value]="lote.id">{{ lote.nombre }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Talla</mat-label>
          <input matInput formControlName="talla" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Color</mat-label>
          <input matInput formControlName="color" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Genero</mat-label>
          <mat-select formControlName="genero">
            <mat-option value="">Sin definir</mat-option>
            @for (genero of generos; track genero) {
              <mat-option [value]="genero">{{ genero }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Estado</mat-label>
          <mat-select formControlName="estado">
            @for (estado of estados; track estado) {
              <mat-option [value]="estado">{{ estado }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Precio compra</mat-label>
          <input matInput type="number" formControlName="precioCompra" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Precio venta</mat-label>
          <input matInput type="number" formControlName="precioVenta" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Precio oferta</mat-label>
          <input matInput type="number" formControlName="precioOferta" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Codigo</mat-label>
          <input matInput formControlName="codigo" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Descripcion</mat-label>
          <textarea matInput rows="3" formControlName="descripcion"></textarea>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Notas</mat-label>
          <textarea matInput rows="2" formControlName="notas"></textarea>
        </mat-form-field>
        <div class="full">
          <app-image-uploader [images]="imagenes()" (uploaded)="imagenes.set($event)" />
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" mat-dialog-close>Cancelar</button>
      <button mat-flat-button class="primary-action" type="button" [disabled]="form.invalid" (click)="save()">
        Guardar cambios
      </button>
    </mat-dialog-actions>
  `,
})
export class ProductEditDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ProductEditDialogComponent>);
  readonly data = inject<ProductEditDialogData>(MAT_DIALOG_DATA);

  readonly categorias = categoriasProducto;
  readonly estados = estadosProducto;
  readonly generos = generosProducto;
  readonly imagenes = signal(imagenesProducto(this.data.producto));

  readonly form = this.fb.nonNullable.group({
    loteId: [this.data.producto.loteId ?? ''],
    nombre: [this.data.producto.nombre, Validators.required],
    marca: [this.data.producto.marca ?? ''],
    categoria: [this.data.producto.categoria ?? 'otro', Validators.required],
    descripcion: [this.data.producto.descripcion, Validators.required],
    talla: [this.data.producto.talla, Validators.required],
    color: [this.data.producto.color ?? ''],
    genero: [this.data.producto.genero ?? ''],
    precioCompra: [precioCompraProducto(this.data.producto), [Validators.required, Validators.min(0)]],
    precioVenta: [precioProducto(this.data.producto), [Validators.required, Validators.min(0)]],
    precioOferta: this.fb.control<number | null>(this.data.producto.precioOferta ?? null),
    estado: [this.data.producto.estado, Validators.required],
    codigo: [this.data.producto.codigo ?? ''],
    notas: [this.data.producto.notas ?? ''],
  });

  save(): void {
    const raw = this.form.getRawValue();
    const { precioOferta, ...productValues } = raw;
    this.dialogRef.close({
      ...productValues,
      loteId: raw.loteId || undefined,
      genero: (raw.genero || undefined) as GeneroProducto | undefined,
      ...(precioOferta === null ? {} : { precioOferta }),
      imagenes: this.imagenes(),
      activo: true,
    } satisfies Partial<Producto>);
  }
}

