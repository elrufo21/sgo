export interface BoletaSummaryDocument {
  id: number;
  docuId: number;
  companiaId: number;
  notaId: number;
  fechaEmision: string;
  docuDocumento: string;
  serieNumero: string;
  cliente: string;
  clienteDni: string;
  subTotal: string;
  igv: string;
  icbper: string;
  total: string;
  usuario: string;
  estadoSunat: string;
}

