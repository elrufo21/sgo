export interface PosCartItem {
  productId: number;
  codigo: string;
  nombre: string;
  unidadMedida?: string;
  precio: number;
  cantidad: number;
  stock?: number;
}

export interface PosTotals {
  subTotal: number;
  total: number;
  itemCount: number;
}
