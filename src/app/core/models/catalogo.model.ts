import { AuditableEntity } from './base.model';

export interface Categoria extends AuditableEntity {
  nombre: string;
}

export interface Marca extends AuditableEntity {
  nombre: string;
}

export const categoriasIniciales = [
  'zapatillas', 'polera', 'chompa', 'canguro', 'pantalon', 'camisa', 'short', 'accesorio', 'otro',
];

export const marcasIniciales = [
  'Adidas', 'Nike', 'Puma', 'Reebok', 'Jordan', 'New Balance', 'Converse', 'Vans',
  'Under Armour', 'The North Face', 'Champion', 'Levi\'s', 'Tommy Hilfiger', 'Calvin Klein',
  'Lacoste', 'Gucci', 'Zara', 'H&M', 'Shein', 'Sin marca',
];
