import { Lote } from './lote.model';

export interface LoteResumen {
  lote: Lote;
  cantidadProductos: number;
  cantidadDisponibles: number;
  cantidadReservados: number;
  cantidadVendidos: number;
  cantidadAgotados: number;
  inversionAsignada: number;
  valorEsperado: number;
  ingresoReal: number;
  gananciaReal: number;
  recuperacionInversion: number;
}
