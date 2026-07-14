import { Injectable, inject } from '@angular/core';
import {
  DocumentData,
  Firestore,
  collection,
  deleteField,
  doc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from '@angular/fire/firestore';

export interface ProductoCleanupAudit {
  total: number;
  sinPrecioVenta: number;
  sinPrecioCompra: number;
  sinImagenes: number;
  conPrecioAntiguo: number;
  conImagenAntigua: number;
  conCamposOpcionalesVacios: number;
  listosParaLimpieza: number;
  conSchemaVersion3: number;
  auditadoEn: Date;
}

export interface ProductoCleanupResult {
  productosLimpiados: number;
  batches: number;
  pendientesDespues: number;
  conSchemaVersion3: number;
  finalizadoEn: Date;
  audit: ProductoCleanupAudit;
}

const COLLECTION_NAME = 'productos';
const MAX_BATCH_SIZE = 400;
const OPTIONAL_FIELDS = ['marca', 'color', 'codigo', 'notas'] as const;

@Injectable({ providedIn: 'root' })
export class ProductoCleanupService {
  private readonly firestore = inject(Firestore);

  async audit(): Promise<ProductoCleanupAudit> {
    const snapshot = await getDocs(collection(this.firestore, COLLECTION_NAME));
    return this.auditDocuments(snapshot.docs.map((item) => item.data()));
  }

  async cleanup(): Promise<ProductoCleanupResult> {
    const snapshot = await getDocs(collection(this.firestore, COLLECTION_NAME));
    const initialAudit = this.auditDocuments(snapshot.docs.map((item) => item.data()));

    if (!this.canCleanup(initialAudit)) {
      throw new Error(this.blockingMessage(initialAudit));
    }

    const pending = snapshot.docs.filter((item) => this.needsCleanup(item.data()));
    let batches = 0;

    for (let offset = 0; offset < pending.length; offset += MAX_BATCH_SIZE) {
      const batch = writeBatch(this.firestore);
      for (const item of pending.slice(offset, offset + MAX_BATCH_SIZE)) {
        const data = item.data();
        const payload: Record<string, unknown> = {
          precio: deleteField(),
          imagen: deleteField(),
          schemaVersion: 3,
          updatedAt: serverTimestamp(),
        };

        for (const field of OPTIONAL_FIELDS) {
          if (data[field] === '') {
            payload[field] = deleteField();
          }
        }

        batch.update(doc(this.firestore, `${COLLECTION_NAME}/${item.id}`), payload);
      }
      await batch.commit();
      batches += 1;
    }

    const finalAudit = await this.audit();
    return {
      productosLimpiados: pending.length,
      batches,
      pendientesDespues: finalAudit.listosParaLimpieza,
      conSchemaVersion3: finalAudit.conSchemaVersion3,
      finalizadoEn: new Date(),
      audit: finalAudit,
    };
  }

  canCleanup(audit: ProductoCleanupAudit): boolean {
    return audit.sinPrecioVenta === 0 && audit.sinPrecioCompra === 0 && audit.sinImagenes === 0;
  }

  private auditDocuments(documents: DocumentData[]): ProductoCleanupAudit {
    return {
      total: documents.length,
      sinPrecioVenta: documents.filter((item) => this.isMissing(item['precioVenta'])).length,
      sinPrecioCompra: documents.filter((item) => this.isMissing(item['precioCompra'])).length,
      sinImagenes: documents.filter((item) => !Array.isArray(item['imagenes'])).length,
      conPrecioAntiguo: documents.filter((item) => this.hasOwn(item, 'precio')).length,
      conImagenAntigua: documents.filter((item) => this.hasOwn(item, 'imagen')).length,
      conCamposOpcionalesVacios: documents.filter((item) => this.hasEmptyOptionalField(item)).length,
      listosParaLimpieza: documents.filter((item) => this.isValid(item) && this.needsCleanup(item)).length,
      conSchemaVersion3: documents.filter((item) => item['schemaVersion'] === 3).length,
      auditadoEn: new Date(),
    };
  }

  private isValid(producto: DocumentData): boolean {
    return (
      !this.isMissing(producto['precioVenta']) &&
      !this.isMissing(producto['precioCompra']) &&
      Array.isArray(producto['imagenes'])
    );
  }

  private needsCleanup(producto: DocumentData): boolean {
    return (
      this.hasOwn(producto, 'precio') ||
      this.hasOwn(producto, 'imagen') ||
      this.hasEmptyOptionalField(producto) ||
      producto['schemaVersion'] !== 3
    );
  }

  private hasEmptyOptionalField(producto: DocumentData): boolean {
    return OPTIONAL_FIELDS.some((field) => producto[field] === '');
  }

  private hasOwn(producto: DocumentData, field: string): boolean {
    return Object.prototype.hasOwnProperty.call(producto, field);
  }

  private isMissing(value: unknown): boolean {
    return value === undefined || value === null;
  }

  private blockingMessage(audit: ProductoCleanupAudit): string {
    return [
      `No se puede ejecutar la limpieza.`,
      `Sin precioVenta: ${audit.sinPrecioVenta}.`,
      `Sin precioCompra: ${audit.sinPrecioCompra}.`,
      `Sin imagenes: ${audit.sinImagenes}.`,
    ].join(' ');
  }
}
