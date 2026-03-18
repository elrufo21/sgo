export interface PosCartItem {
  productId: number;
  codigo: string;
  nombre: string;
  unidadMedida?: string;
  precio: number;
  precioMinimo?: number;
  cantidad: number;
  stock?: number;
  detalleId?: number;
}

export interface PosTotals {
  subTotal: number;
  total: number;
  itemCount: number;
}
