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

export interface BoletaSummarySentRecord {
  id: number;
  resumenId: number;
  companiaId: number;
  fechaEmision: string;
  fechaEnvio: string;
  serie: string;
  rangoNumeros: string;
  subTotal: string;
  igv: string;
  icbper: string;
  total: string;
  ticket: string;
  codigoSunat: string;
  hashCdr: string;
  mensaje: string;
  usuario: string;
  estado: string;
}

export interface BoletaSummarySendDetailPayload {
  item: number;
  tipoComprobante: string;
  nroComprobante: string;
  tipoDocumento: string;
  nroDocumento: string;
  tipoComprobanteRef: string;
  nroComprobanteRef: string;
  statu: string;
  codMoneda: string;
  total: number;
  icbper: number;
  gravada: number;
  isc: number;
  igv: number;
  otros: number;
  cargoXAsignacion: number;
  montoCargoXAsig: number;
  exonerado: number;
  inafecto: number;
  exportacion: number;
  gratuitas: number;
  docuId?: number;
  notaId?: number;
}

export interface BoletaSummarySendPayload {
  NRO_DOCUMENTO_EMPRESA: string;
  RAZON_SOCIAL: string;
  USUARIO?: string;
  Usuario?: string;
  usuario?: string;
  USUARIO_REGISTRO?: string;
  TIPO_DOCUMENTO: string;
  CODIGO: string;
  SERIE: string;
  SECUENCIA: string;
  FECHA_REFERENCIA: string;
  FECHA_DOCUMENTO: string;
  TIPO_PROCESO: string | number;
  CONTRA_FIRMA: string;
  USUARIO_SOL_EMPRESA: string;
  PASS_SOL_EMPRESA: string;
  RUTA_PFX: string;
  COMPANIA_ID: number;
  RANGO_NUMEROS: string;
  SUBTOTAL: number;
  IGV: number;
  ICBPER: number;
  TOTAL: number;
  detalle: BoletaSummarySendDetailPayload[];
}

export interface BoletaSummarySendResponse {
  ok: boolean;
  flg_rta: string;
  mensaje: string;
  cod_sunat: string;
  msj_sunat: string;
  hash_cpe: string;
  hash_cdr: string;
  ticket: string;
  entorno_usado: string;
  tipo_proceso_usado: number | null;
  registro_bd: {
    ok: boolean;
    mensaje: string;
    resultado: string;
  };
}
