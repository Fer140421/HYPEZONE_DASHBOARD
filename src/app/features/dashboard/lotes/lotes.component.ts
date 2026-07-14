import { AsyncPipe, CurrencyPipe, DatePipe, DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { Timestamp } from '@angular/fire/firestore';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest, map, shareReplay } from 'rxjs';
import { Lote, emptyLote, loteFechaCompra } from '../../../core/models/lote.model';
import { LoteResumen } from '../../../core/models/lote-resumen.model';
import { Producto, estadosProducto, generosProducto, GeneroProducto, imagenesProducto, precioCompraProducto, precioProducto } from '../../../core/models/producto.model';
import { Venta } from '../../../core/models/venta.model';
import { LoteRepository } from '../../../core/repositories/lote.repository';
import { ProductoRepository } from '../../../core/repositories/producto.repository';
import { CategoriaRepository } from '../../../core/repositories/categoria.repository';
import { MarcaRepository } from '../../../core/repositories/marca.repository';
import { VentaRepository } from '../../../core/repositories/venta.repository';
import { LoteAnalyticsService } from '../../../core/services/lote-analytics.service';
import { LoteDeactivationMode, LoteDomainError, LoteManagementService } from '../../../core/services/lote-management.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusChipComponent } from '../../../shared/components/status-chip/status-chip.component';
import { ImageUploaderComponent } from '../../../shared/components/image-uploader/image-uploader.component';

interface LotesData {
  resumenes: LoteResumen[];
  productos: Producto[];
  ventas: Venta[];
}

interface LoteDetail {
  resumen: LoteResumen;
  productos: Producto[];
  ventas: Venta[];
  productosSinPrecioCompra: Producto[];
  productosSinLote: Producto[];
  diferenciaInversion: number;
}

@Component({
  selector: 'app-lotes',
  standalone: true,
  imports: [
    AsyncPipe, CurrencyPipe, DatePipe, DecimalPipe, NgTemplateOutlet, RouterLink, ReactiveFormsModule,
    MatButtonModule, MatCardModule, MatDatepickerModule, MatDialogModule, MatFormFieldModule,
    MatIconModule, MatInputModule, MatSelectModule, MatSnackBarModule, MatTableModule,
    PageHeaderComponent, StatusChipComponent,
  ],
  template: `
    @if (mode() === 'list') {
      <app-page-header title="Lotes" description="Inventario y rentabilidad calculados desde productos y ventas.">
        <button mat-flat-button class="primary-action" routerLink="/dashboard/lotes/nuevo">
          <mat-icon>add</mat-icon> Nuevo lote
        </button>
      </app-page-header>
      @if (data$ | async; as data) {
        <mat-card class="wide-table"><table mat-table [dataSource]="data.resumenes">
          <ng-container matColumnDef="nombre"><th mat-header-cell *matHeaderCellDef>Lote</th><td mat-cell *matCellDef="let r"><strong>{{ r.lote.nombre }}</strong></td></ng-container>
          <ng-container matColumnDef="fecha"><th mat-header-cell *matHeaderCellDef>Compra</th><td mat-cell *matCellDef="let r">{{ fecha(r.lote.fechaCompra) | date: 'mediumDate' }}</td></ng-container>
          <ng-container matColumnDef="costo"><th mat-header-cell *matHeaderCellDef>Costo</th><td mat-cell *matCellDef="let r">{{ r.lote.costoTotal | currency: 'BOB' : 'symbol-narrow' }}</td></ng-container>
          <ng-container matColumnDef="productos"><th mat-header-cell *matHeaderCellDef>Productos</th><td mat-cell *matCellDef="let r">{{ r.cantidadProductos }}</td></ng-container>
          <ng-container matColumnDef="disponibles"><th mat-header-cell *matHeaderCellDef>Disponibles</th><td mat-cell *matCellDef="let r">{{ r.cantidadDisponibles }}</td></ng-container>
          <ng-container matColumnDef="vendidos"><th mat-header-cell *matHeaderCellDef>Vendidos</th><td mat-cell *matCellDef="let r">{{ r.cantidadVendidos }}</td></ng-container>
          <ng-container matColumnDef="inversion"><th mat-header-cell *matHeaderCellDef>Asignado</th><td mat-cell *matCellDef="let r">{{ r.inversionAsignada | currency: 'BOB' : 'symbol-narrow' }}</td></ng-container>
          <ng-container matColumnDef="esperado"><th mat-header-cell *matHeaderCellDef>Esperado</th><td mat-cell *matCellDef="let r">{{ r.valorEsperado | currency: 'BOB' : 'symbol-narrow' }}</td></ng-container>
          <ng-container matColumnDef="ingreso"><th mat-header-cell *matHeaderCellDef>Ingreso real</th><td mat-cell *matCellDef="let r">{{ r.ingresoReal | currency: 'BOB' : 'symbol-narrow' }}</td></ng-container>
          <ng-container matColumnDef="ganancia"><th mat-header-cell *matHeaderCellDef>Ganancia</th><td mat-cell *matCellDef="let r">{{ r.gananciaReal | currency: 'BOB' : 'symbol-narrow' }}</td></ng-container>
          <ng-container matColumnDef="recuperacion"><th mat-header-cell *matHeaderCellDef>Recuperacion</th><td mat-cell *matCellDef="let r">{{ r.recuperacionInversion | number: '1.0-1' }}%</td></ng-container>
          <ng-container matColumnDef="estado"><th mat-header-cell *matHeaderCellDef>Estado</th><td mat-cell *matCellDef="let r">{{ r.lote.activo === false ? 'Inactivo' : 'Activo' }}</td></ng-container>
          <ng-container matColumnDef="acciones"><th mat-header-cell *matHeaderCellDef></th><td mat-cell *matCellDef="let r"><button mat-icon-button [routerLink]="['/dashboard/lotes', r.lote.id]" aria-label="Ver lote"><mat-icon>visibility</mat-icon></button><button mat-icon-button [routerLink]="['/dashboard/lotes', r.lote.id, 'editar']" aria-label="Modificar lote"><mat-icon>edit</mat-icon></button></td></ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr><tr mat-row *matRowDef="let row; columns: columns"></tr>
        </table></mat-card>
      }
    } @else {
      <app-page-header [title]="mode() === 'new' ? 'Nuevo lote' : mode() === 'edit' ? 'Modificar lote' : 'Detalle de lote'">
        <button mat-button routerLink="/dashboard/lotes">Volver</button>
      </app-page-header>

      @if (mode() === 'new') {
        <ng-container *ngTemplateOutlet="loteForm" />
      } @else if (detail$ | async; as detail) {
        @if (mode() === 'edit') {
        <section class="detail-actions">
          <button mat-flat-button class="primary-action" type="button" (click)="openProductDialog(detail.resumen.lote)" [disabled]="detail.resumen.lote.activo === false"><mat-icon>add</mat-icon> Registrar producto</button>
          @if (detail.resumen.lote.activo === false) {
            <button mat-stroked-button type="button" (click)="restore(detail.resumen.lote)"><mat-icon>restore</mat-icon> Restaurar lote</button>
          } @else {
            <button mat-stroked-button color="warn" type="button" (click)="deactivate(detail)"><mat-icon>archive</mat-icon> Desactivar lote</button>
          }
        </section>
        }

        <section class="detail-grid">
          @if (mode() === 'edit') {
            <ng-container *ngTemplateOutlet="loteForm" />
          } @else {
            <mat-card class="overview-card">
              <mat-card-header><mat-card-title>{{ detail.resumen.lote.nombre }}</mat-card-title><mat-card-subtitle>Información general del lote</mat-card-subtitle></mat-card-header>
              <mat-card-content class="info-grid">
                <div><span>Fecha de compra</span><strong>{{ fecha(detail.resumen.lote.fechaCompra) | date: 'longDate' }}</strong></div>
                <div><span>Costo total</span><strong>{{ detail.resumen.lote.costoTotal | currency: 'BOB' : 'symbol-narrow' }}</strong></div>
                <div><span>Proveedor</span><strong>{{ detail.resumen.lote.proveedor || 'No registrado' }}</strong></div>
                <div><span>Lugar de compra</span><strong>{{ detail.resumen.lote.lugarCompra || 'No registrado' }}</strong></div>
                <div class="full"><span>Descripción</span><strong>{{ detail.resumen.lote.descripcion || 'Sin descripción' }}</strong></div>
                <div class="full"><span>Notas</span><strong>{{ detail.resumen.lote.notas || 'Sin notas' }}</strong></div>
              </mat-card-content>
            </mat-card>
          }
          <mat-card><mat-card-header><mat-card-title>Metricas financieras</mat-card-title></mat-card-header><mat-card-content><div class="stat-list">
            <span>Productos reales <strong>{{ detail.resumen.cantidadProductos }}</strong></span>
            <span>Disponibles <strong>{{ detail.resumen.cantidadDisponibles }}</strong></span>
            <span>Reservados <strong>{{ detail.resumen.cantidadReservados }}</strong></span>
            <span>Vendidos <strong>{{ detail.resumen.cantidadVendidos }}</strong></span>
            <span>Agotados <strong>{{ detail.resumen.cantidadAgotados }}</strong></span>
            <span>Inversion asignada <strong>{{ detail.resumen.inversionAsignada | currency: 'BOB' : 'symbol-narrow' }}</strong></span>
            <span>Valor esperado <strong>{{ detail.resumen.valorEsperado | currency: 'BOB' : 'symbol-narrow' }}</strong></span>
            <span>Ingreso real <strong>{{ detail.resumen.ingresoReal | currency: 'BOB' : 'symbol-narrow' }}</strong></span>
            <span>Ganancia real <strong>{{ detail.resumen.gananciaReal | currency: 'BOB' : 'symbol-narrow' }}</strong></span>
            <span>Recuperacion <strong>{{ detail.resumen.recuperacionInversion | number: '1.0-1' }}%</strong></span>
            <span>Diferencia costo/asignado <strong>{{ detail.diferenciaInversion | currency: 'BOB' : 'symbol-narrow' }}</strong></span>
          </div></mat-card-content></mat-card>
        </section>

        @if (Math.abs(detail.diferenciaInversion) > 0.01) {
          <mat-card class="warning-card"><mat-card-content><mat-icon>warning</mat-icon> El costo total del lote no coincide con la suma de precios de compra de los productos asociados.</mat-card-content></mat-card>
        }

        @if (mode() === 'edit') {
        <mat-card><mat-card-header><mat-card-title>Asociar producto existente sin lote</mat-card-title></mat-card-header><mat-card-content>
          <form class="inline-form" [formGroup]="associateForm" (ngSubmit)="associate(detail.resumen.lote)">
            <mat-form-field appearance="outline"><mat-label>Producto</mat-label><mat-select formControlName="productoId">
              @for (producto of detail.productosSinLote; track producto.id) { <mat-option [value]="producto.id">{{ producto.nombre }}</mat-option> }
            </mat-select></mat-form-field>
            <button mat-flat-button type="submit" [disabled]="associateForm.invalid || detail.resumen.lote.activo === false">Asociar</button>
          </form>
          @if (detail.resumen.lote.activo === false) { <p class="muted">El lote está inactivo.</p> }
        </mat-card-content></mat-card>
        }

        <mat-card><mat-card-header><mat-card-title>Productos asociados</mat-card-title></mat-card-header><mat-card-content>
          <div class="product-list">@for (producto of detail.productos; track producto.id) {
            <div class="linked-row">@if (foto(producto); as imagen) { <img class="product-thumb" [src]="imagen" [alt]="producto.nombre" /> } @else { <span class="product-thumb placeholder"><mat-icon>image</mat-icon></span> }<span class="product-name">{{ producto.nombre }}</span><span>{{ precioCompra(producto) | currency: 'BOB' : 'symbol-narrow' }} / {{ precio(producto) | currency: 'BOB' : 'symbol-narrow' }}</span><app-status-chip [status]="producto.estado" />@if (mode() === 'edit') { <button mat-icon-button type="button" (click)="confirmUnlink(detail.resumen.lote, producto)" aria-label="Desvincular producto"><mat-icon>link_off</mat-icon></button> }</div>
          } @empty { <p class="muted">Este lote no tiene productos activos asociados.</p> }</div>
        </mat-card-content></mat-card>

        <mat-card><mat-card-header><mat-card-title>Ventas asociadas</mat-card-title></mat-card-header><mat-card-content>
          <div class="product-list">@for (venta of detail.ventas; track venta.id) { <div class="linked-row"><span>{{ venta.nombreProducto }}</span><span>{{ venta.fechaVenta | date: 'mediumDate' }}</span><strong>{{ venta.precioVenta | currency: 'BOB' : 'symbol-narrow' }}</strong><span>Ganancia {{ venta.ganancia | currency: 'BOB' : 'symbol-narrow' }}</span></div> } @empty { <p class="muted">No hay ventas activas asociadas por loteId.</p> }</div>
        </mat-card-content></mat-card>

        <mat-card><mat-card-header><mat-card-title>Productos sin precio de compra</mat-card-title></mat-card-header><mat-card-content>
          @for (producto of detail.productosSinPrecioCompra; track producto.id) { <p><a [routerLink]="['/dashboard/productos', producto.id]">{{ producto.nombre }}</a></p> } @empty { <p class="muted">Todos los productos tienen precio de compra mayor a cero.</p> }
        </mat-card-content></mat-card>
      }
    }

    <ng-template #loteForm><mat-card><mat-card-content>
      <form class="form-grid" [formGroup]="form" (ngSubmit)="save()">
        <mat-form-field appearance="outline"><mat-label>Nombre</mat-label><input matInput formControlName="nombre" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Fecha de compra</mat-label><input matInput [matDatepicker]="picker" formControlName="fechaCompra" /><mat-datepicker-toggle matIconSuffix [for]="picker" /><mat-datepicker #picker /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Proveedor</mat-label><input matInput formControlName="proveedor" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Lugar de compra</mat-label><input matInput formControlName="lugarCompra" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Costo total</mat-label><input matInput type="number" formControlName="costoTotal" /></mat-form-field>
        <mat-form-field appearance="outline" class="full"><mat-label>Descripcion</mat-label><textarea matInput rows="3" formControlName="descripcion"></textarea></mat-form-field>
        <mat-form-field appearance="outline" class="full"><mat-label>Notas</mat-label><textarea matInput rows="3" formControlName="notas"></textarea></mat-form-field>
        <button mat-flat-button class="primary-action" type="submit" [disabled]="form.invalid">{{ currentId() ? 'Guardar cambios' : 'Guardar lote' }}</button>
      </form>
    </mat-card-content></mat-card></ng-template>
  `,
  styles: `
    .wide-table { overflow-x: auto; } table { min-width: 1500px; } .detail-actions { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:16px; }
    .warning-card { margin:16px 0; border:1px solid var(--mat-sys-error); } .warning-card mat-card-content { display:flex; gap:10px; align-items:center; }
    .inline-form { display:flex; align-items:center; gap:12px; flex-wrap:wrap; } .inline-form mat-form-field { min-width:280px; flex:1; }
    .linked-row { display:grid; grid-template-columns:56px minmax(180px,2fr) repeat(2,minmax(120px,1fr)) auto; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid var(--mat-sys-outline-variant); }
    .product-thumb { width:48px; height:48px; border-radius:8px; object-fit:cover; display:grid; place-items:center; background:var(--mat-sys-surface-container-high); }
    .overview-card { border-top:4px solid var(--mat-sys-primary); } .info-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:22px; padding-top:20px; }
    .info-grid div { display:flex; flex-direction:column; gap:5px; } .info-grid span { color:var(--mat-sys-on-surface-variant); font-size:.82rem; } .info-grid .full { grid-column:1/-1; } .product-name { font-weight:600; }
    @media (max-width: 760px) { .linked-row, .info-grid { grid-template-columns:1fr; } .info-grid .full { grid-column:auto; } }
  `,
})
export class LotesComponent implements OnInit {
  readonly Math = Math;
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly lotes = inject(LoteRepository);
  private readonly productos = inject(ProductoRepository);
  private readonly ventas = inject(VentaRepository);
  private readonly analytics = inject(LoteAnalyticsService);
  private readonly management = inject(LoteManagementService);

  readonly columns = ['nombre','fecha','costo','productos','disponibles','vendidos','inversion','esperado','ingreso','ganancia','recuperacion','estado','acciones'];
  readonly mode = signal<'list' | 'new' | 'detail' | 'edit'>('list');
  readonly currentId = signal<string | null>(null);
  readonly data$ = combineLatest([
    this.lotes.getAll(true), this.productos.getAll(true), this.ventas.getAll(true),
  ]).pipe(map(([lotes, productos, ventas]) => ({ resumenes: this.analytics.getResumenesLotes(lotes, productos, ventas), productos, ventas })), shareReplay({ bufferSize: 1, refCount: true }));
  readonly detail$ = combineLatest([this.data$, this.route.paramMap]).pipe(map(([data, params]) => this.buildDetail(data, params.get('id'))), shareReplay({ bufferSize: 1, refCount: true }));

  readonly form = this.fb.nonNullable.group({
    nombre: ['', Validators.required], descripcion: [''], fechaCompra: [new Date(), Validators.required],
    proveedor: [''], lugarCompra: [''], costoTotal: [0, [Validators.required, Validators.min(0)]], notas: [''],
  });
  readonly associateForm = this.fb.nonNullable.group({ productoId: ['', Validators.required] });

  ngOnInit(): void {
    this.route.url.subscribe((segments) => {
      const paths = segments.map((segment) => segment.path);
      this.mode.set(paths.includes('nuevo') ? 'new' : paths.includes('editar') ? 'edit' : this.route.snapshot.paramMap.has('id') ? 'detail' : 'list');
    });
    this.detail$.subscribe((detail) => {
      if (!detail) {
        if (this.mode() === 'new') this.form.reset({ nombre:emptyLote.nombre, descripcion:emptyLote.descripcion, fechaCompra:new Date(), proveedor:emptyLote.proveedor, lugarCompra:emptyLote.lugarCompra, costoTotal:emptyLote.costoTotal, notas:emptyLote.notas });
        return;
      }
      const lote = detail.resumen.lote;
      this.currentId.set(lote.id ?? null);
      this.form.patchValue({ nombre:lote.nombre, descripcion:lote.descripcion ?? '', fechaCompra:loteFechaCompra(lote.fechaCompra), proveedor:lote.proveedor ?? '', lugarCompra:lote.lugarCompra ?? '', costoTotal:Number(lote.costoTotal), notas:lote.notas ?? '' });
    });
  }

  fecha(value: Lote['fechaCompra']): Date { return loteFechaCompra(value); }
  precio(producto: Producto): number { return precioProducto(producto); }
  precioCompra(producto: Producto): number { return precioCompraProducto(producto); }
  foto(producto: Producto): string { return imagenesProducto(producto)[0] ?? ''; }

  async save(): Promise<void> {
    const raw = this.form.getRawValue();
    const payload: Partial<Lote> = { ...raw, fechaCompra: Timestamp.fromDate(raw.fechaCompra), schemaVersion: 2 };
    try {
      if (this.currentId()) {
        await this.lotes.update(this.currentId()!, payload);
        this.message('Lote actualizado correctamente.');
        await this.router.navigate(['/dashboard/lotes']);
      } else {
        const id = await this.lotes.create({ ...payload, cantidadProductos: 0, activo: true });
        this.message('Lote creado correctamente.');
        await this.router.navigate(['/dashboard/lotes', id, 'editar']);
      }
    } catch (error) { this.showError(error); }
  }

  openProductDialog(lote: Lote): void {
    if (!lote.id || lote.activo === false) return;
    this.dialog.open(LoteProductCreateDialogComponent, {
      width: 'min(920px, 96vw)',
      maxHeight: '94vh',
      data: { loteId: lote.id },
    });
  }

  async associate(lote: Lote): Promise<void> {
    if (!lote.id) return;
    try {
      await this.management.associateProduct(lote.id, this.associateForm.getRawValue().productoId);
      this.associateForm.reset({ productoId: '' });
      this.message('Producto asociado al lote.');
    } catch (error) {
      if (error instanceof LoteDomainError && error.code === 'CONFIRMAR_REASIGNACION_VENDIDO') {
        this.confirmHistoricalMove(lote, this.associateForm.getRawValue().productoId, error.message);
        return;
      }
      this.showError(error);
    }
  }

  confirmUnlink(lote: Lote, producto: Producto): void {
    if (!lote.id || !producto.id) return;
    this.dialog.open(ConfirmDialogComponent, { data: { title:'Desvincular producto', message:`Se quitará "${producto.nombre}" del lote sin borrar el producto.`, confirmText:'Desvincular' } }).afterClosed().subscribe(async (confirmed) => {
      if (!confirmed) return;
      try { await this.management.unlinkProduct(lote.id!, producto.id!); this.message('Producto desvinculado del lote.'); } catch (error) { this.showError(error); }
    });
  }

  deactivate(detail: LoteDetail): void {
    const lote = detail.resumen.lote;
    if (!lote.id) return;
    const ref = this.dialog.open(LoteDeactivateDialogComponent, { data: { nombre:lote.nombre, cantidad:detail.productos.length } });
    ref.afterClosed().subscribe(async (mode?: LoteDeactivationMode) => {
      if (!mode) return;
      try { await this.management.deactivateLote(lote.id!, mode); this.message('Lote desactivado correctamente.'); } catch (error) { this.showError(error); }
    });
  }

  async restore(lote: Lote): Promise<void> {
    if (!lote.id) return;
    try { await this.management.restoreLote(lote.id); this.message('Lote restaurado correctamente.'); } catch (error) { this.showError(error); }
  }

  private confirmHistoricalMove(lote: Lote, productoId: string, message: string): void {
    this.dialog.open(ConfirmDialogComponent, { data: { title:'Confirmar reasignación', message, confirmText:'Reasignar producto' } }).afterClosed().subscribe(async (confirmed) => {
      if (!confirmed || !lote.id) return;
      try { await this.management.associateProduct(lote.id, productoId, true); this.associateForm.reset({ productoId:'' }); this.message('Producto asociado al lote.'); } catch (error) { this.showError(error); }
    });
  }

  private buildDetail(data: LotesData, id: string | null): LoteDetail | null {
    const resumen = data.resumenes.find((item) => item.lote.id === id);
    if (!resumen) return null;
    const productos = data.productos.filter((p) => p.activo !== false && p.loteId === id);
    const ventas = data.ventas.filter((v) => v.activo !== false && v.loteId === id);
    return { resumen, productos, ventas, productosSinPrecioCompra: productos.filter((p) => !Number(p.precioCompra)), productosSinLote: data.productos.filter((p) => p.activo !== false && !p.loteId), diferenciaInversion: Number(resumen.lote.costoTotal) - resumen.inversionAsignada };
  }

  private message(text: string): void { this.snackBar.open(text, 'OK', { duration: 2800 }); }
  private showError(error: unknown): void { this.message(error instanceof Error ? error.message : 'No se pudo completar la operación.'); }
}

@Component({
  selector: 'app-lote-product-create-dialog', standalone: true,
  imports: [AsyncPipe, ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule, ImageUploaderComponent],
  template: `
    <h2 mat-dialog-title>Agregar productos al lote</h2>
    <mat-dialog-content><p class="muted">Registra un producto y continúa agregando los que necesites.</p>
      <form class="form-grid" [formGroup]="form">
        <mat-form-field appearance="outline"><mat-label>Nombre</mat-label><input matInput formControlName="nombre" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Marca</mat-label><mat-select formControlName="marca"><mat-option value="">Sin definir</mat-option>@for (item of marcas$ | async; track item.id) { <mat-option [value]="item.nombre">{{ item.nombre }}</mat-option> }</mat-select></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Categoría</mat-label><mat-select formControlName="categoria">@for (item of categorias$ | async; track item.id) { <mat-option [value]="item.nombre">{{ item.nombre }}</mat-option> }</mat-select></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Talla</mat-label><input matInput formControlName="talla" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Color</mat-label><input matInput formControlName="color" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Género</mat-label><mat-select formControlName="genero"><mat-option value="">Sin definir</mat-option>@for (item of generos; track item) { <mat-option [value]="item">{{ item }}</mat-option> }</mat-select></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Estado</mat-label><mat-select formControlName="estado">@for (item of estados; track item) { <mat-option [value]="item">{{ item }}</mat-option> }</mat-select></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Precio compra</mat-label><input matInput type="number" formControlName="precioCompra" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Precio venta</mat-label><input matInput type="number" formControlName="precioVenta" /></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Código</mat-label><input matInput formControlName="codigo" /></mat-form-field>
        <mat-form-field appearance="outline" class="full"><mat-label>Descripción</mat-label><textarea matInput rows="2" formControlName="descripcion"></textarea></mat-form-field>
        <div class="full"><app-image-uploader [images]="imagenes()" [maxImages]="1" (uploaded)="imagenes.set($event)" (error)="message($event)" /></div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end"><button mat-button type="button" (click)="finish()">Finalizar</button><button mat-flat-button class="primary-action" type="button" [disabled]="form.invalid || saving()" (click)="saveAndContinue()"><mat-icon>add</mat-icon>{{ saving() ? 'Guardando...' : 'Guardar y agregar otro' }}</button></mat-dialog-actions>
  `,
})
export class LoteProductCreateDialogComponent {
  private readonly fb = inject(FormBuilder); private readonly productos = inject(ProductoRepository); private readonly categoriaRepository = inject(CategoriaRepository); private readonly marcaRepository = inject(MarcaRepository); private readonly ref = inject(MatDialogRef<LoteProductCreateDialogComponent>); private readonly snack = inject(MatSnackBar);
  readonly data = inject<{ loteId:string }>(MAT_DIALOG_DATA); readonly categorias$ = this.categoriaRepository.getAll(); readonly marcas$ = this.marcaRepository.getAll(); readonly estados = estadosProducto; readonly generos = generosProducto; readonly imagenes = signal<string[]>([]); readonly saving = signal(false);
  readonly form = this.fb.nonNullable.group({ nombre:['',Validators.required], marca:[''], categoria:['otro',Validators.required], descripcion:['',Validators.required], talla:['',Validators.required], color:[''], genero:[''], precioCompra:[0,[Validators.required,Validators.min(0)]], precioVenta:[0,[Validators.required,Validators.min(0)]], estado:['disponible',Validators.required], codigo:[''] });
  async saveAndContinue(): Promise<void> { if (this.form.invalid || this.saving()) return; this.saving.set(true); try { const raw=this.form.getRawValue(); await this.productos.create({ ...raw, loteId:this.data.loteId, genero:(raw.genero || undefined) as GeneroProducto | undefined, imagenes:this.imagenes(), activo:true } as Partial<Producto>); this.message('Producto agregado al lote.'); this.form.reset({ nombre:'',marca:'',categoria:'otro',descripcion:'',talla:'',color:'',genero:'',precioCompra:0,precioVenta:0,estado:'disponible',codigo:'' }); this.imagenes.set([]); } catch(error) { this.message(error instanceof Error ? error.message : 'No se pudo guardar el producto.'); } finally { this.saving.set(false); } }
  finish(): void { this.ref.close(); }
  message(text:string): void { this.snack.open(text,'OK',{duration:2500}); }
}

@Component({
  selector: 'app-lote-deactivate-dialog', standalone: true,
  imports: [MatButtonModule, MatDialogModule],
  template: `<h2 mat-dialog-title>Desactivar lote</h2><mat-dialog-content>El lote "{{ data.nombre }}" tiene {{ data.cantidad }} productos activos asociados. Las ventas históricas no se modificarán.</mat-dialog-content><mat-dialog-actions align="end"><button mat-button (click)="close()">Cancelar</button><button mat-stroked-button color="warn" (click)="close('preserve')">Desactivar y conservar vínculos</button><button mat-flat-button color="warn" (click)="close('unlink')">Desactivar y desvincular</button></mat-dialog-actions>`,
})
export class LoteDeactivateDialogComponent {
  readonly data = inject<{ nombre:string; cantidad:number }>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<LoteDeactivateDialogComponent>);
  close(mode?: LoteDeactivationMode): void { this.ref.close(mode); }
}
