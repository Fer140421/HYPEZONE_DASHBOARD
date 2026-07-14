import { AsyncPipe, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest, map, startWith } from 'rxjs';
import { Producto, imagenesProducto, precioProducto } from '../../../core/models/producto.model';
import { MetodoPago, Venta, metodosPago } from '../../../core/models/venta.model';
import { ProductoRepository } from '../../../core/repositories/producto.repository';
import { VentaRepository } from '../../../core/repositories/venta.repository';
import { VentaService } from '../../../core/services/venta.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [
    AsyncPipe, CurrencyPipe, DatePipe, RouterLink, ReactiveFormsModule, MatButtonModule,
    MatCardModule, MatDatepickerModule, MatDialogModule, MatFormFieldModule, MatIconModule, MatInputModule,
    MatSelectModule, MatSnackBarModule, MatTableModule, PageHeaderComponent,
  ],
  template: `
    <app-page-header
      [title]="mode() === 'new' ? 'Nueva venta' : mode() === 'edit' ? 'Editar venta' : 'Ventas'"
      [description]="mode() === 'list' ? 'Historial de productos vendidos.' : 'Selecciona las prendas y ajusta el precio final antes de guardar.'"
    >
      @if (mode() === 'list') {
        <button mat-flat-button class="primary-action" routerLink="/dashboard/ventas/nueva"><mat-icon>point_of_sale</mat-icon> Nueva venta</button>
      } @else {
        <button mat-button routerLink="/dashboard/ventas"><mat-icon>arrow_back</mat-icon> Volver</button>
      }
    </app-page-header>

    @if (mode() === 'new' || mode() === 'edit') {
      <div class="sale-layout">
        <section class="catalog-panel">
          <div class="section-heading">
            <div><span class="eyebrow">Paso 1</span><h2>Elige los productos</h2><p>Solo se muestran prendas disponibles.</p></div>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Buscar producto</mat-label><mat-icon matPrefix>search</mat-icon>
              <input matInput [formControl]="searchControl" placeholder="Nombre, marca o código" />
            </mat-form-field>
          </div>

          <div class="product-grid">
            @for (producto of catalogo$ | async; track producto.id) {
              <mat-card class="product-card" [class.selected]="isSelected(producto)">
                <div class="image-wrap">
                  @if (image(producto); as src) { <img [src]="src" [alt]="producto.nombre" /> }
                  @else { <div class="no-image"><mat-icon>checkroom</mat-icon></div> }
                  @if (hasOffer(producto)) { <span class="offer-badge">OFERTA</span> }
                </div>
                <mat-card-content>
                  <div class="product-meta"><span>{{ producto.marca || producto.categoria || 'Producto' }}</span><span>Talla {{ producto.talla }}</span></div>
                  <h3>{{ producto.nombre }}</h3>
                  <div class="catalog-price">
                    @if (hasOffer(producto)) { <del>{{ precio(producto) | currency: 'BOB' : 'symbol-narrow' }}</del> }
                    <strong>{{ effectivePrice(producto) | currency: 'BOB' : 'symbol-narrow' }}</strong>
                  </div>
                  <button mat-stroked-button type="button" class="add-button" [disabled]="isSelected(producto)" (click)="addProduct(producto)">
                    <mat-icon>{{ isSelected(producto) ? 'check' : 'add_shopping_cart' }}</mat-icon>{{ isSelected(producto) ? 'Agregado' : 'Agregar' }}
                  </button>
                </mat-card-content>
              </mat-card>
            } @empty {
              <div class="empty-catalog"><mat-icon>inventory_2</mat-icon><h3>No hay productos disponibles</h3><p>Prueba otra búsqueda o revisa el inventario.</p></div>
            }
          </div>
        </section>

        <aside class="checkout-panel">
          <mat-card class="checkout-card">
            <mat-card-header><div><span class="eyebrow">Paso 2</span><mat-card-title>Detalle de venta</mat-card-title></div><span class="item-count">{{ detalles.length }} prendas</span></mat-card-header>
            <mat-card-content>
              <form [formGroup]="saleForm" (ngSubmit)="registrarVenta()">
                <div formArrayName="detalles" class="cart-list">
                  @for (control of detalles.controls; track control.getRawValue().productoId; let i = $index) {
                    <div class="cart-item" [formGroupName]="i">
                      @if (selectedImage(control.getRawValue().productoId); as src) { <img [src]="src" alt="" /> }
                      @else { <div class="cart-placeholder"><mat-icon>checkroom</mat-icon></div> }
                      <div class="cart-info"><strong>{{ control.getRawValue().nombre }}</strong><small>{{ selectedSubtitle(control.getRawValue().productoId) }}</small>
                        @if (control.getRawValue().precioOriginal !== control.getRawValue().precioBase) { <span class="offer-text">Precio de oferta aplicado</span> }
                      </div>
                      <mat-form-field appearance="outline" subscriptSizing="dynamic" class="price-input">
                        <mat-label>Precio final</mat-label><span matTextPrefix>Bs&nbsp;</span><input matInput type="number" min="0" formControlName="precioFinal" />
                      </mat-form-field>
                      <button mat-icon-button type="button" color="warn" (click)="removeProduct(i)" aria-label="Quitar producto"><mat-icon>close</mat-icon></button>
                    </div>
                  } @empty {
                    <div class="empty-cart"><mat-icon>shopping_bag</mat-icon><strong>Tu venta está vacía</strong><span>Agrega productos desde el catálogo.</span></div>
                  }
                </div>

                <div class="total-row"><span>Total a cobrar</span><strong>{{ total | currency: 'BOB' : 'symbol-narrow' }}</strong></div>
                <div class="payment-grid">
                  <mat-form-field appearance="outline"><mat-label>Método de pago</mat-label><mat-select formControlName="metodoPago">@for (metodo of metodos; track metodo) { <mat-option [value]="metodo">{{ metodo }}</mat-option> }</mat-select></mat-form-field>
                  <mat-form-field appearance="outline"><mat-label>Fecha</mat-label><input matInput [matDatepicker]="picker" formControlName="fechaVenta" /><mat-datepicker-toggle matIconSuffix [for]="picker" /><mat-datepicker #picker /></mat-form-field>
                  <mat-form-field appearance="outline"><mat-label>Cliente (opcional)</mat-label><input matInput formControlName="clienteNombre" /></mat-form-field>
                  <mat-form-field appearance="outline"><mat-label>Teléfono (opcional)</mat-label><input matInput formControlName="clienteTelefono" /></mat-form-field>
                  <mat-form-field appearance="outline" class="full"><mat-label>Notas</mat-label><textarea matInput rows="2" formControlName="notas"></textarea></mat-form-field>
                </div>
                <button mat-flat-button class="primary-action confirm-button" type="submit" [disabled]="saleForm.invalid || detalles.length === 0 || procesandoVenta()">
                  <mat-icon>check_circle</mat-icon>{{ procesandoVenta() ? 'Procesando...' : mode() === 'edit' ? 'Guardar cambios' : 'Confirmar venta' }}
                </button>
                <p class="transaction-note"><mat-icon>lock</mat-icon>El inventario y todos los detalles se actualizan juntos.</p>
              </form>
            </mat-card-content>
          </mat-card>
        </aside>
      </div>
    } @else {
      @if (summary$ | async; as summary) {
        <section class="summary-cards"><mat-card><span>Detalles vendidos</span><strong>{{ summary.totalVentas }}</strong></mat-card><mat-card><span>Total vendido</span><strong>{{ summary.totalVendido | currency: 'BOB' : 'symbol-narrow' }}</strong></mat-card><mat-card><span>Ganancia</span><strong>{{ summary.ganancia | currency: 'BOB' : 'symbol-narrow' }}</strong></mat-card></section>
      }
      <mat-card>
        <form class="filters" [formGroup]="filters"><mat-form-field appearance="outline"><mat-label>Producto</mat-label><input matInput formControlName="producto" /></mat-form-field><mat-form-field appearance="outline"><mat-label>Método de pago</mat-label><mat-select formControlName="metodoPago"><mat-option value="">Todos</mat-option>@for (metodo of metodos; track metodo) { <mat-option [value]="metodo">{{ metodo }}</mat-option> }</mat-select></mat-form-field><mat-form-field appearance="outline"><mat-label>Desde</mat-label><input matInput [matDatepicker]="fromPicker" formControlName="desde" /><mat-datepicker-toggle matIconSuffix [for]="fromPicker" /><mat-datepicker #fromPicker /></mat-form-field></form>
        <div class="table-scroll"><table mat-table [dataSource]="(ventasFiltradas$ | async) ?? []">
          <ng-container matColumnDef="nombreProducto"><th mat-header-cell *matHeaderCellDef>Producto</th><td mat-cell *matCellDef="let venta"><strong>{{ venta.nombreProducto }}</strong></td></ng-container>
          <ng-container matColumnDef="operacion"><th mat-header-cell *matHeaderCellDef>Venta</th><td mat-cell *matCellDef="let venta">{{ venta.operacionId ? '#' + venta.operacionId.slice(0, 6).toUpperCase() : 'Individual' }}</td></ng-container>
          <ng-container matColumnDef="fechaVenta"><th mat-header-cell *matHeaderCellDef>Fecha</th><td mat-cell *matCellDef="let venta">{{ venta.fechaVenta | date: 'mediumDate' }}</td></ng-container>
          <ng-container matColumnDef="precioVenta"><th mat-header-cell *matHeaderCellDef>Precio acordado</th><td mat-cell *matCellDef="let venta">{{ venta.precioVenta | currency: 'BOB' : 'symbol-narrow' }}</td></ng-container>
          <ng-container matColumnDef="ganancia"><th mat-header-cell *matHeaderCellDef>Ganancia</th><td mat-cell *matCellDef="let venta">{{ venta.ganancia | currency: 'BOB' : 'symbol-narrow' }}</td></ng-container>
          <ng-container matColumnDef="metodoPago"><th mat-header-cell *matHeaderCellDef>Pago</th><td mat-cell *matCellDef="let venta">{{ venta.metodoPago || 'otro' }}</td></ng-container>
          <ng-container matColumnDef="acciones"><th mat-header-cell *matHeaderCellDef>Acciones</th><td mat-cell *matCellDef="let venta" class="sale-actions"><button mat-icon-button type="button" (click)="viewSale(venta)" aria-label="Ver venta"><mat-icon>visibility</mat-icon></button><button mat-icon-button type="button" (click)="editSale(venta)" aria-label="Editar venta"><mat-icon>edit</mat-icon></button></td></ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr><tr mat-row *matRowDef="let row; columns: columns"></tr>
        </table></div>
      </mat-card>
    }
  `,
  styles: `
    .sale-layout{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(390px,.75fr);gap:24px;align-items:start}.catalog-panel{min-width:0}.section-heading{display:flex;justify-content:space-between;gap:20px;align-items:start;margin-bottom:18px}.section-heading h2{margin:3px 0}.section-heading p{margin:0;color:var(--mat-sys-on-surface-variant)}.section-heading mat-form-field{width:min(330px,100%)}.eyebrow{font-size:.72rem;text-transform:uppercase;letter-spacing:.11em;font-weight:800;color:var(--mat-sys-primary)}
    .product-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:14px}.product-card{overflow:hidden;transition:transform .18s,border-color .18s;border:1px solid transparent}.product-card:hover{transform:translateY(-2px)}.product-card.selected{border-color:var(--mat-sys-primary);opacity:.72}.image-wrap{height:155px;position:relative;background:var(--mat-sys-surface-container)}.image-wrap img{width:100%;height:100%;object-fit:cover}.no-image{height:100%;display:grid;place-items:center}.no-image mat-icon{width:48px;height:48px;font-size:48px;color:var(--mat-sys-outline)}.offer-badge{position:absolute;top:10px;left:10px;background:#d83b01;color:#fff;padding:5px 8px;border-radius:999px;font-size:.68rem;font-weight:800}.product-card mat-card-content{padding:14px}.product-card h3{font-size:1rem;margin:7px 0 10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.product-meta{display:flex;justify-content:space-between;gap:8px;font-size:.72rem;color:var(--mat-sys-on-surface-variant)}.catalog-price{display:flex;gap:8px;align-items:baseline;margin-bottom:12px}.catalog-price del{color:var(--mat-sys-outline);font-size:.8rem}.catalog-price strong{font-size:1.18rem;color:var(--mat-sys-primary)}.add-button{width:100%}
    .checkout-panel{position:sticky;top:18px}.checkout-card{border-top:4px solid var(--mat-sys-primary)}.checkout-card mat-card-header{display:flex;justify-content:space-between;align-items:start;margin-bottom:12px}.item-count{background:var(--mat-sys-primary-container);padding:5px 9px;border-radius:999px;font-size:.75rem}.cart-list{display:flex;flex-direction:column;gap:10px;max-height:360px;overflow:auto}.cart-item{display:grid;grid-template-columns:52px minmax(100px,1fr) 112px 38px;gap:10px;align-items:center;padding:9px;border-radius:12px;background:var(--mat-sys-surface-container-low)}.cart-item>img,.cart-placeholder{width:52px;height:52px;border-radius:9px;object-fit:cover;background:var(--mat-sys-surface-container-high);display:grid;place-items:center}.cart-info{display:flex;flex-direction:column;min-width:0}.cart-info strong{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cart-info small{color:var(--mat-sys-on-surface-variant)}.offer-text{font-size:.65rem;color:#b82d00;font-weight:700}.price-input{width:112px}.empty-cart,.empty-catalog{display:flex;flex-direction:column;align-items:center;text-align:center;color:var(--mat-sys-on-surface-variant);padding:32px;grid-column:1/-1}.empty-cart mat-icon,.empty-catalog mat-icon{font-size:42px;width:42px;height:42px}.total-row{display:flex;justify-content:space-between;align-items:center;border-block:1px solid var(--mat-sys-outline-variant);padding:18px 0;margin:16px 0}.total-row strong{font-size:1.7rem;color:var(--mat-sys-primary)}.payment-grid{display:grid;grid-template-columns:1fr 1fr;gap:0 12px}.payment-grid .full{grid-column:1/-1}.confirm-button{width:100%;height:48px}.transaction-note{display:flex;align-items:center;justify-content:center;gap:5px;font-size:.72rem;color:var(--mat-sys-on-surface-variant);margin:10px 0 0}.transaction-note mat-icon{font-size:15px;width:15px;height:15px}
    .summary-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:18px}.summary-cards mat-card{padding:18px;display:flex;flex-direction:column;gap:5px}.summary-cards span{color:var(--mat-sys-on-surface-variant)}.summary-cards strong{font-size:1.45rem}.table-scroll{overflow:auto}table{width:100%;min-width:900px}.sale-actions{white-space:nowrap}
    @media(max-width:1050px){.sale-layout{grid-template-columns:1fr}.checkout-panel{position:static}}@media(max-width:650px){.section-heading{flex-direction:column}.section-heading mat-form-field{width:100%}.product-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.image-wrap{height:130px}.cart-item{grid-template-columns:46px 1fr 38px}.price-input{grid-column:2/4;width:100%}.payment-grid,.summary-cards{grid-template-columns:1fr}.payment-grid .full{grid-column:auto}}
  `,
})
export class VentasComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly productoRepository = inject(ProductoRepository);
  private readonly ventaRepository = inject(VentaRepository);
  private readonly ventaService = inject(VentaService);
  readonly metodos = metodosPago;
  readonly columns = ['nombreProducto','operacion','fechaVenta','precioVenta','ganancia','metodoPago','acciones'];
  readonly mode = signal<'list'|'new'|'edit'>('list');
  readonly procesandoVenta = signal(false);
  readonly searchControl = this.fb.nonNullable.control('');
  private productosDisponibles: Producto[] = [];
  private ventasActuales: Venta[] = [];
  private editOriginalDetails: Venta[] = [];
  private readonly selected = new Map<string, Producto>();

  readonly catalogo$ = combineLatest([this.productoRepository.getAll(true), this.searchControl.valueChanges.pipe(startWith(''))]).pipe(map(([allProducts, search]) => {
    const productos = allProducts.filter((producto) => producto.activo !== false && (producto.estado === 'disponible' || (!!producto.id && (this.selected.has(producto.id) || this.editOriginalDetails.some(item=>item.productoId===producto.id)))));
    this.productosDisponibles = allProducts;
    const term = search.toLowerCase().trim();
    return productos.filter((p) => !term || [p.nombre,p.marca,p.codigo,p.categoria].some((value) => (value ?? '').toLowerCase().includes(term)));
  }));

  readonly saleForm = this.fb.nonNullable.group({
    detalles: this.fb.array([] as ReturnType<VentasComponent['createDetailGroup']>[]),
    metodoPago:['efectivo',Validators.required], fechaVenta:[new Date(),Validators.required],
    clienteNombre:[''], clienteTelefono:[''], notas:[''],
  });
  get detalles(): FormArray { return this.saleForm.controls.detalles; }
  get total(): number { return this.detalles.controls.reduce((sum, control) => sum + Number(control.get('precioFinal')?.value ?? 0), 0); }

  readonly filters=this.fb.nonNullable.group({producto:[''],metodoPago:[''],desde:[null as Date|null]});
  readonly ventasFiltradas$=combineLatest([this.ventaRepository.getAll(),this.filters.valueChanges.pipe(startWith(this.filters.getRawValue()))]).pipe(map(([ventas,filters])=>{this.ventasActuales=ventas;const producto=(filters.producto??'').toLowerCase().trim();const desde=filters.desde?new Date(filters.desde).getTime():0;return ventas.filter(v=>(!producto||v.nombreProducto.toLowerCase().includes(producto))&&(!filters.metodoPago||v.metodoPago===filters.metodoPago)&&(!desde||new Date(v.fechaVenta).getTime()>=desde));}));
  readonly summary$=this.ventasFiltradas$.pipe(map(ventas=>({totalVentas:ventas.length,totalVendido:ventas.reduce((t,v)=>t+Number(v.precioVenta),0),ganancia:ventas.reduce((t,v)=>t+Number(v.ganancia),0)})));

  ngOnInit():void{
    this.route.url.subscribe(segments=>this.mode.set(segments.some(s=>s.path==='nueva')?'new':segments.some(s=>s.path==='editar')?'edit':'list'));
    combineLatest([this.route.paramMap,this.productoRepository.getAll(true),this.ventaRepository.getAll()]).subscribe(([params,productos,ventas])=>{
      this.productosDisponibles=productos;
      if(this.mode()!=='edit'||this.editOriginalDetails.length)return;
      const id=params.get('id');if(!id)return;
      const detalles=ventas.filter(item=>item.operacionId===id||(!item.operacionId&&item.id===id));if(!detalles.length)return;
      this.editOriginalDetails=detalles;
      const first=detalles[0];
      this.saleForm.patchValue({metodoPago:first.metodoPago??'efectivo',fechaVenta:new Date(first.fechaVenta),clienteNombre:first.clienteNombre??'',clienteTelefono:first.clienteTelefono??'',notas:first.notas??''});
      detalles.forEach(detalle=>{const producto=productos.find(item=>item.id===detalle.productoId);if(!producto?.id)return;this.selected.set(producto.id,producto);const group=this.createDetailGroup(producto);group.patchValue({precioFinal:Number(detalle.precioVenta)});this.detalles.push(group);});
      this.searchControl.setValue(this.searchControl.value);
    });
  }
  precio(producto:Producto):number{return precioProducto(producto);}
  effectivePrice(producto:Producto):number{const offer=Number(producto.precioOferta);return producto.precioOferta!==undefined&&Number.isFinite(offer)&&offer>=0&&offer<this.precio(producto)?offer:this.precio(producto);}
  hasOffer(producto:Producto):boolean{return this.effectivePrice(producto)<this.precio(producto);}
  image(producto:Producto):string{return imagenesProducto(producto)[0]??'';}
  isSelected(producto:Producto):boolean{return !!producto.id&&this.selected.has(producto.id);}
  selectedImage(id:string):string{return this.image(this.selected.get(id)!);}
  selectedSubtitle(id:string):string{const p=this.selected.get(id);return p?[p.marca,p.talla&&`Talla ${p.talla}`].filter(Boolean).join(' · '):'';}
  addProduct(producto:Producto):void{if(!producto.id||this.selected.has(producto.id))return;this.selected.set(producto.id,producto);this.detalles.push(this.createDetailGroup(producto));}
  removeProduct(index:number):void{const id=this.detalles.at(index).get('productoId')?.value;this.detalles.removeAt(index);if(id)this.selected.delete(id);}
  viewSale(venta:Venta):void{this.dialog.open(VentaViewDialogComponent,{width:'min(860px,96vw)',maxHeight:'92vh',data:{detalles:this.operationDetails(venta),productos:this.productosDisponibles}});}
  editSale(venta:Venta):void{void this.router.navigate(['/dashboard/ventas',venta.operacionId??venta.id,'editar']);}
  private operationDetails(venta:Venta):Venta[]{return venta.operacionId?this.ventasActuales.filter(item=>item.operacionId===venta.operacionId):[venta];}
  private createDetailGroup(producto:Producto){return this.fb.nonNullable.group({productoId:[producto.id!],nombre:[producto.nombre],precioOriginal:[this.precio(producto)],precioBase:[this.effectivePrice(producto)],precioFinal:[this.effectivePrice(producto),[Validators.required,Validators.min(0)]]});}

  async registrarVenta():Promise<void>{if(this.saleForm.invalid||!this.detalles.length||this.procesandoVenta())return;this.procesandoVenta.set(true);try{const raw=this.saleForm.getRawValue();const detalles=raw.detalles.map(d=>({producto:this.selected.get(d.productoId)!,precioVenta:Number(d.precioFinal)}));const input={metodoPago:raw.metodoPago as never,fechaVenta:raw.fechaVenta.toISOString(),clienteNombre:raw.clienteNombre,clienteTelefono:raw.clienteTelefono,notas:raw.notas};if(this.mode()==='edit')await this.ventaService.editarVentaCompleta(this.editOriginalDetails,detalles,input);else await this.ventaService.registrarVentaMultiple(detalles,input);this.snackBar.open(this.mode()==='edit'?'Venta actualizada correctamente.':`Venta registrada: ${raw.detalles.length} producto(s) por Bs ${this.total.toFixed(2)}.`,'OK',{duration:3500});await this.router.navigate(['/dashboard/ventas']);}catch(error){this.snackBar.open(error instanceof Error?error.message:'No se pudo guardar la venta.','OK',{duration:4000});}finally{this.procesandoVenta.set(false);}}
}

interface VentaDialogData { detalles: Venta[]; productos: Producto[]; }
interface VentaEditResult {
  precios: Record<string, number>; metodoPago: MetodoPago; fechaVenta: string;
  clienteNombre?: string; clienteTelefono?: string; notas?: string;
}

@Component({
  selector:'app-venta-view-dialog', standalone:true,
  imports:[CurrencyPipe,DatePipe,MatButtonModule,MatDialogModule,MatIconModule],
  template:`
    <h2 mat-dialog-title><mat-icon>receipt_long</mat-icon> Detalle de venta</h2>
    <mat-dialog-content>
      <div class="sale-code">{{ operationLabel }}</div>
      <section class="view-info"><div><span>Fecha</span><strong>{{ first.fechaVenta | date:'longDate' }}</strong></div><div><span>Método de pago</span><strong>{{ first.metodoPago || 'otro' }}</strong></div><div><span>Cliente</span><strong>{{ first.clienteNombre || 'No registrado' }}</strong></div><div><span>Teléfono</span><strong>{{ first.clienteTelefono || 'No registrado' }}</strong></div></section>
      <h3>Productos</h3><div class="view-details">@for(detalle of data.detalles;track detalle.id){
        <article class="view-product">
          @if(productImage(detalle);as src){<img [src]="src" [alt]="detalle.nombreProducto"/>}@else{<div class="view-placeholder"><mat-icon>checkroom</mat-icon></div>}
          <div class="product-data"><strong>{{ detalle.nombreProducto }}</strong><small>{{ productMeta(detalle) }}</small><small>Precio de compra: {{ detalle.precioCompra | currency:'BOB':'symbol-narrow' }}</small><small>Ganancia: {{ detalle.ganancia | currency:'BOB':'symbol-narrow' }}</small></div>
          <strong class="sold-price">{{ detalle.precioVenta | currency:'BOB':'symbol-narrow' }}</strong>
        </article>
      }</div>
      <div class="view-total"><span>Total</span><strong>{{ total | currency:'BOB':'symbol-narrow' }}</strong></div>
      @if(first.notas){<div class="notes"><span>Notas</span><p>{{ first.notas }}</p></div>}
    </mat-dialog-content><mat-dialog-actions align="end"><button mat-flat-button class="primary-action" mat-dialog-close>Cerrar</button></mat-dialog-actions>
  `,
  styles:`h2{display:flex;align-items:center;gap:9px}.sale-code{display:inline-block;background:var(--mat-sys-primary-container);padding:6px 10px;border-radius:999px;font-weight:700;margin-bottom:18px}.view-info{display:grid;grid-template-columns:1fr 1fr;gap:18px}.view-info div,.notes{display:flex;flex-direction:column;gap:4px}.view-info span,.notes span{font-size:.75rem;color:var(--mat-sys-on-surface-variant)}.view-details{display:grid;grid-template-columns:1fr 1fr;gap:12px}.view-product{display:grid;grid-template-columns:82px 1fr;gap:12px;padding:12px;border:1px solid var(--mat-sys-outline-variant);border-radius:14px}.view-product img,.view-placeholder{width:82px;height:96px;object-fit:cover;border-radius:10px;background:var(--mat-sys-surface-container);display:grid;place-items:center}.product-data{display:flex;flex-direction:column;gap:3px;min-width:0}.product-data>strong{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.product-data small{color:var(--mat-sys-on-surface-variant)}.sold-price{grid-column:1/-1;text-align:right;color:var(--mat-sys-primary);font-size:1.15rem}.view-total{display:flex;justify-content:space-between;align-items:center;padding:20px 0;font-size:1.25rem}.view-total strong{font-size:1.6rem;color:var(--mat-sys-primary)}@media(max-width:650px){.view-info,.view-details{grid-template-columns:1fr}}`,
})
export class VentaViewDialogComponent{
  readonly data=inject<VentaDialogData>(MAT_DIALOG_DATA);readonly first=this.data.detalles[0];
  readonly total=this.data.detalles.reduce((sum,item)=>sum+Number(item.precioVenta),0);
  readonly operationLabel=this.first.operacionId?`Venta #${this.first.operacionId.slice(0,6).toUpperCase()}`:'Venta individual';
  product(detalle:Venta):Producto|undefined{return this.data.productos.find(item=>item.id===detalle.productoId);}
  productImage(detalle:Venta):string{const producto=this.product(detalle);return producto?imagenesProducto(producto)[0]??'':'';}
  productMeta(detalle:Venta):string{const producto=this.product(detalle);return producto?[producto.marca,producto.categoria,producto.talla&&`Talla ${producto.talla}`,producto.color].filter(Boolean).join(' · '):'Producto vendido';}
}

@Component({
  selector:'app-venta-edit-dialog',standalone:true,
  imports:[CurrencyPipe,ReactiveFormsModule,MatButtonModule,MatDatepickerModule,MatDialogModule,MatFormFieldModule,MatInputModule,MatSelectModule],
  template:`
    <h2 mat-dialog-title>Editar venta</h2><mat-dialog-content><p class="edit-help">Puedes corregir los datos comerciales y el precio acordado. Los productos permanecerán vendidos.</p>
      <form [formGroup]="form" class="edit-form"><div formArrayName="precios" class="edit-products">@for(control of precios.controls;track data.detalles[$index].id;let i=$index){<div [formGroupName]="i"><span><strong>{{ data.detalles[i].nombreProducto }}</strong><small>Precio de compra: {{ data.detalles[i].precioCompra | currency:'BOB':'symbol-narrow' }}</small></span><mat-form-field appearance="outline" subscriptSizing="dynamic"><mat-label>Precio acordado</mat-label><span matTextPrefix>Bs&nbsp;</span><input matInput type="number" min="0" formControlName="precio" /></mat-form-field></div>}</div>
        <div class="edit-total"><span>Nuevo total</span><strong>{{ total | currency:'BOB':'symbol-narrow' }}</strong></div>
        <div class="fields"><mat-form-field appearance="outline"><mat-label>Método de pago</mat-label><mat-select formControlName="metodoPago">@for(metodo of metodos;track metodo){<mat-option [value]="metodo">{{ metodo }}</mat-option>}</mat-select></mat-form-field><mat-form-field appearance="outline"><mat-label>Fecha</mat-label><input matInput [matDatepicker]="editPicker" formControlName="fechaVenta"/><mat-datepicker-toggle matIconSuffix [for]="editPicker"/><mat-datepicker #editPicker/></mat-form-field><mat-form-field appearance="outline"><mat-label>Cliente</mat-label><input matInput formControlName="clienteNombre"/></mat-form-field><mat-form-field appearance="outline"><mat-label>Teléfono</mat-label><input matInput formControlName="clienteTelefono"/></mat-form-field><mat-form-field appearance="outline" class="full"><mat-label>Notas</mat-label><textarea matInput rows="2" formControlName="notas"></textarea></mat-form-field></div>
      </form></mat-dialog-content><mat-dialog-actions align="end"><button mat-button (click)="close()">Cancelar</button><button mat-flat-button class="primary-action" [disabled]="form.invalid" (click)="save()">Guardar cambios</button></mat-dialog-actions>
  `,
  styles:`.edit-help{color:var(--mat-sys-on-surface-variant)}.edit-products{display:flex;flex-direction:column}.edit-products>div{display:grid;grid-template-columns:1fr 180px;gap:16px;align-items:center;padding:10px 0;border-bottom:1px solid var(--mat-sys-outline-variant)}.edit-products span{display:flex;flex-direction:column}.edit-products small{color:var(--mat-sys-on-surface-variant)}.edit-total{display:flex;justify-content:space-between;padding:18px 0;font-size:1.2rem}.edit-total strong{font-size:1.45rem;color:var(--mat-sys-primary)}.fields{display:grid;grid-template-columns:1fr 1fr;gap:0 12px}.fields .full{grid-column:1/-1}@media(max-width:560px){.edit-products>div,.fields{grid-template-columns:1fr}.fields .full{grid-column:auto}}`,
})
export class VentaEditDialogComponent{
  private readonly fb=inject(FormBuilder);private readonly ref=inject(MatDialogRef<VentaEditDialogComponent>);readonly data=inject<VentaDialogData>(MAT_DIALOG_DATA);readonly metodos=metodosPago;readonly first=this.data.detalles[0];
  readonly form=this.fb.nonNullable.group({precios:this.fb.array(this.data.detalles.map(item=>this.fb.nonNullable.group({precio:[Number(item.precioVenta),[Validators.required,Validators.min(0)]]}))),metodoPago:[this.first.metodoPago??'efectivo',Validators.required],fechaVenta:[new Date(this.first.fechaVenta),Validators.required],clienteNombre:[this.first.clienteNombre??''],clienteTelefono:[this.first.clienteTelefono??''],notas:[this.first.notas??'']});
  get precios():FormArray{return this.form.controls.precios;}get total():number{return this.precios.controls.reduce((sum,item)=>sum+Number(item.get('precio')?.value??0),0);}
  close():void{this.ref.close();}save():void{if(this.form.invalid)return;const raw=this.form.getRawValue();const precios:Record<string,number>={};this.data.detalles.forEach((item,index)=>{if(item.id)precios[item.id]=Number(raw.precios[index].precio);});this.ref.close({precios,metodoPago:raw.metodoPago as MetodoPago,fechaVenta:raw.fechaVenta.toISOString(),clienteNombre:raw.clienteNombre,clienteTelefono:raw.clienteTelefono,notas:raw.notas} satisfies VentaEditResult);}
}
