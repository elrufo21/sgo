export interface ServiceInvoiceListCompra {
  compraId: number;
  notaId?: number | null;
  companiaId?: number;
  documento?: string;
  tipoCodigo: string;
  compraConcepto: string;
  serie: string;
  numero: string;
  nroComprobante?: string;
  fechaEmision: string;
  fechaVto?: string;
  fechaRegistro?: string;
  clienteId?: number;
  clienteRazon?: string;
  clienteRuc?: string;
  clienteDni?: string;
  direccionFiscal?: string;
  subTotal?: number;
  igv?: number;
  total: number;
  saldo?: number;
  montoDetraccion?: number;
  letras?: string;
  estado?: string;
  estadoSunat?: string;
  codigoSunat?: string;
  mensajeSunat?: string;
  docuHash?: string;
  formaPago?: string;
  condicion?: string;
  origenModulo?: string;
  totalDetalles?: number;
  xmlUrl?: string;
  pdfUrl?: string;
  cdrUrl?: string;
}

export interface ServiceInvoiceListDetail {
  detalleCompraId: number;
  compraId: number;
  productId?: number | null;
  codigoProducto?: string;
  codigoSunat?: string;
  unidadMedida?: string;
  detalleDesc: string;
  detalleCant: number;
  detallePrecio: number;
  importe?: number;
}

export interface ServiceInvoiceListItem {
  compra: ServiceInvoiceListCompra;
  detalles: ServiceInvoiceListDetail[];
}

export interface ServiceInvoiceFilters {
  estado?: string;
  fechaInicio?: string;
  fechaFin?: string;
  page?: number;
  pageSize?: number;
}

export interface ServiceInvoiceCorrelative {
  ok: boolean;
  companiaId: number;
  serie: string;
  ultimoNumero: string;
  numero: string;
  nroComprobante: string;
}

export interface ServiceProduct {
  id: number;
  idSubLinea: number | null;
  codigo: string;
  nombre: string;
  unidadMedida: string;
  costo: number;
  venta: number;
  estado: string;
  aplicaINV: string;
  codigoSunat?: string;
}

export interface ServiceProductFilters {
  estado?: string;
  nombre?: string;
  page?: number;
  pageSize?: number;
}

export interface ServiceInvoicePayloadDetail {
  item: number;
  unidadMedida: "ZZ";
  cantidad: number;
  precio: number;
  importe: number;
  igv: number;
  precioSinImpuesto: number;
  codTipoOperacion: "10";
  codigo: string;
  codigoSunat: string;
  descripcion: string;
}

export interface ServiceInvoiceSendPayload {
  TIPO_PROCESO: 3;
  TIPO_OPERACION: "1001";
  NRO_COMPROBANTE: string;
  FECHA_DOCUMENTO: string;
  FECHA_VTO: string;
  COD_MONEDA: "PEN" | "USD";
  FORMA_PAGO: "Contado" | "Credito";
  NRO_DOCUMENTO_EMPRESA: string;
  TIPO_DOCUMENTO_EMPRESA: "6";
  RAZON_SOCIAL_EMPRESA: string;
  NOMBRE_COMERCIAL_EMPRESA: string;
  CODIGO_UBIGEO_EMPRESA: string;
  DIRECCION_EMPRESA: string;
  DEPARTAMENTO_EMPRESA: string;
  PROVINCIA_EMPRESA: string;
  DISTRITO_EMPRESA: string;
  CODIGO_PAIS_EMPRESA: "PE";
  CODIGO_ANEXO: "0000";
  USUARIO_SOL_EMPRESA: string;
  PASS_SOL_EMPRESA: string;
  CONTRA_FIRMA: string;
  RUTA_PFX: string;
  NRO_DOCUMENTO_CLIENTE: string;
  TIPO_DOCUMENTO_CLIENTE: "6";
  RAZON_SOCIAL_CLIENTE: string;
  DIRECCION_CLIENTE: string;
  COD_PAIS_CLIENTE: "PE";
  TOTAL_GRAVADAS: number;
  SUB_TOTAL: number;
  POR_IGV: 18;
  TOTAL_IGV: number;
  TOTAL_DESCUENTO: 0;
  TOTAL: number;
  TOTAL_LETRAS: string;
  CUENTA_DETRACCION: string;
  MONTO_DETRACCION: number;
  detalle: ServiceInvoicePayloadDetail[];
}

export interface ServiceInvoiceFormValues {
  nroComprobante: string;
  fechaDocumento: string;
  fechaVto: string;
  codMoneda: "PEN" | "USD";
  formaPago: "Contado" | "Credito";
  nroDocumentoCliente: string;
  razonSocialCliente: string;
  direccionCliente: string;
  clienteCorreo: string;
}

export interface ServiceInvoiceDetailInput {
  id: string;
  productId?: number | null;
  cantidad: string;
  precioSinImpuesto: string;
  descripcion: string;
  codigo: string;
  codigoSunat: string;
}
