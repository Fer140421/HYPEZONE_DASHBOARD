import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  ProductoCleanupAudit,
  ProductoCleanupResult,
  ProductoCleanupService,
} from '../../../core/services/producto-cleanup.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-limpieza-productos',
  standalone: true,
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    PageHeaderComponent,
  ],
  template: `
    <app-page-header
      title="Limpieza temporal de productos"
      description="Audita y retira campos antiguos sin borrar productos, cambiar IDs ni eliminar archivos."
    />

    <mat-card>
      <mat-card-content>
        <p>
          La auditoría es de solo lectura. La limpieza debe iniciarse manualmente y solo se habilita
          cuando todos los productos tienen el esquema nuevo obligatorio.
        </p>
        <p>
          Eliminar la URL antigua de Firestore no elimina ninguna imagen almacenada en Cloudinary.
        </p>
        <div class="actions">
          <button mat-stroked-button type="button" [disabled]="working()" (click)="runAudit()">
            <mat-icon>fact_check</mat-icon>
            Ejecutar auditoría
          </button>
          <button
            mat-flat-button
            color="warn"
            type="button"
            [disabled]="working() || !audit() || !canCleanup() || audit()!.listosParaLimpieza === 0"
            (click)="confirmCleanup()"
          >
            <mat-icon>cleaning_services</mat-icon>
            Ejecutar limpieza
          </button>
          @if (working()) {
            <mat-spinner diameter="28" />
          }
        </div>
        @if (audit() && !canCleanup()) {
          <p class="error">
            Limpieza bloqueada: corrige los productos que no tienen precioVenta, precioCompra o
            imagenes antes de continuar.
          </p>
        }
        @if (error()) {
          <p class="error"><strong>Error:</strong> {{ error() }}</p>
        }
      </mat-card-content>
    </mat-card>

    @if (audit(); as currentAudit) {
      <section class="metric-grid">
        <mat-card><span>Total de productos</span><strong>{{ currentAudit.total }}</strong></mat-card>
        <mat-card><span>Sin precioVenta</span><strong>{{ currentAudit.sinPrecioVenta }}</strong></mat-card>
        <mat-card><span>Sin precioCompra</span><strong>{{ currentAudit.sinPrecioCompra }}</strong></mat-card>
        <mat-card><span>Sin imagenes</span><strong>{{ currentAudit.sinImagenes }}</strong></mat-card>
        <mat-card><span>Con precio antiguo</span><strong>{{ currentAudit.conPrecioAntiguo }}</strong></mat-card>
        <mat-card><span>Con imagen antigua</span><strong>{{ currentAudit.conImagenAntigua }}</strong></mat-card>
        <mat-card><span>Con opcionales vacíos</span><strong>{{ currentAudit.conCamposOpcionalesVacios }}</strong></mat-card>
        <mat-card><span>Listos para limpieza</span><strong>{{ currentAudit.listosParaLimpieza }}</strong></mat-card>
        <mat-card><span>Con schemaVersion 3</span><strong>{{ currentAudit.conSchemaVersion3 }}</strong></mat-card>
      </section>
      <p class="muted">Última auditoría: {{ currentAudit.auditadoEn | date: 'medium' }}</p>
    }

    @if (result(); as cleanupResult) {
      <mat-card>
        <mat-card-header><mat-card-title>Resultado verificado</mat-card-title></mat-card-header>
        <mat-card-content>
          <div class="result-list">
            <span>Productos limpiados <strong>{{ cleanupResult.productosLimpiados }}</strong></span>
            <span>Batches confirmados <strong>{{ cleanupResult.batches }}</strong></span>
            <span>Pendientes después de verificar <strong>{{ cleanupResult.pendientesDespues }}</strong></span>
            <span>Productos con schemaVersion 3 <strong>{{ cleanupResult.conSchemaVersion3 }}</strong></span>
            <span>Finalizada <strong>{{ cleanupResult.finalizadoEn | date: 'medium' }}</strong></span>
          </div>
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: `
    .actions { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; margin-top: 20px; }
    .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin: 20px 0; }
    .metric-grid mat-card { padding: 20px; display: grid; gap: 8px; }
    .metric-grid strong { font-size: 2rem; }
    .result-list { display: grid; gap: 12px; padding-top: 12px; }
    .result-list span { display: flex; justify-content: space-between; gap: 16px; }
    .error { color: var(--mat-sys-error); margin-top: 16px; }
  `,
})
export class LimpiezaProductosComponent {
  private readonly cleanupService = inject(ProductoCleanupService);
  private readonly dialog = inject(MatDialog);

  readonly audit = signal<ProductoCleanupAudit | null>(null);
  readonly result = signal<ProductoCleanupResult | null>(null);
  readonly working = signal(false);
  readonly error = signal('');

  canCleanup(): boolean {
    const current = this.audit();
    return current ? this.cleanupService.canCleanup(current) : false;
  }

  async runAudit(): Promise<void> {
    this.working.set(true);
    this.error.set('');
    try {
      this.audit.set(await this.cleanupService.audit());
    } catch (error) {
      this.error.set(this.messageFrom(error));
    } finally {
      this.working.set(false);
    }
  }

  confirmCleanup(): void {
    const current = this.audit();
    if (!current || !this.cleanupService.canCleanup(current) || !current.listosParaLimpieza) return;

    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Confirmar limpieza definitiva',
        message:
          'Esta acción eliminará definitivamente los campos antiguos precio e imagen de los documentos, pero no eliminará productos ni imágenes de Cloudinary.',
        confirmText: 'Limpiar productos',
      },
    });
    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) void this.runCleanup();
    });
  }

  private async runCleanup(): Promise<void> {
    this.working.set(true);
    this.error.set('');
    this.result.set(null);
    try {
      const result = await this.cleanupService.cleanup();
      this.result.set(result);
      this.audit.set(result.audit);
    } catch (error) {
      this.error.set(this.messageFrom(error));
    } finally {
      this.working.set(false);
    }
  }

  private messageFrom(error: unknown): string {
    return error instanceof Error ? error.message : 'No se pudo completar la operación.';
  }
}
