export interface OrderNoteApiItem {
  notaId?: string | number | null;
  documento?: string | null;
  fecha?: string | null;
  cliente?: string | null;
  formaPago?: string | null;
  total?: string | number | null;
  acuenta?: string | number | null;
  saldo?: string | number | null;
  usuario?: string | null;
  estado?: string | null;
}

export interface OrderNote {
  id: number;
  notaId: string;
  documento: string;
  fecha: string;
  cliente: string;
  formaPago: string;
  total: string;
  acuenta: string;
  saldo: string;
  usuario: string;
  estado: string;
}
