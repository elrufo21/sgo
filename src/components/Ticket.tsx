import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
const styles = StyleSheet.create({
  page: {
    backgroundColor: "#fff",
    padding: "15px",
    fontFamily: "Helvetica",
    fontSize: 9,
    display: "flex",
    flexDirection: "column",
    width: "80mm",
  },
  header: {
    marginBottom: 8,
    textAlign: "center",
    width: "100%",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 6,
    alignSelf: "center",
    objectFit: "contain",
  },
  subtitle: {
    fontSize: 8,
    color: "#666",
    marginBottom: 10,
  },
  companyBox: {
    borderWidth: 1,
    borderColor: "#000",
    borderRadius: 3,
    padding: 6,
    marginBottom: 8,
    fontWeight: "bold",
    //  backgroundColor: "#fffbeb",
  },
  companyText: {
    fontSize: 8,
    textAlign: "center",
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 8,
    textAlign: "center",
  },
  ticketNumber: {
    fontSize: 11,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    marginVertical: 8,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 4,
    fontSize: 8,
  },
  infoLabel: {
    width: "35%",
    fontWeight: "bold",
  },
  infoValue: {
    width: "65%",
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingBottom: 4,
    marginBottom: 6,
    marginTop: 8,
  },
  tableHeaderText: {
    fontSize: 8,
    fontWeight: "bold",
  },
  colCant: {
    width: "15%",
  },
  colDesc: {
    width: "45%",
  },
  colPUni: {
    width: "20%",
    textAlign: "right",
  },
  colImporte: {
    width: "20%",
    textAlign: "right",
  },
  tableRow: {
    flexDirection: "row",
    marginBottom: 6,
    fontSize: 8,
  },
  itemsCount: {
    fontSize: 8,
    marginTop: 6,
    marginBottom: 6,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
    fontSize: 9,
  },
  summaryLabel: {
    width: "70%",
    textAlign: "right",
    paddingRight: 10,
  },
  summaryValue: {
    width: "30%",
    textAlign: "right",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#000",
    fontSize: 10,
    fontWeight: "bold",
  },
  footer: {
    marginTop: 12,
    fontSize: 7,
    textAlign: "center",
    color: "#333",
  },
  footerText: {
    marginBottom: 3,
  },
  qrPlaceholder: {
    width: 80,
    height: 80,
    borderWidth: 2,
    borderColor: "#000",
    alignSelf: "center",
    marginTop: 10,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  qrText: {
    fontSize: 8,
  },
});
const ticketData = {
  logo: "/logo.jpg",
  qrData: "https://tu-url.com/boleta?id=396548",
  companyName: "CONSORCIO FERRETERO ROSITA E.I.R.L.",
  ruc: "20601070155",
  address: "Calle 2 Mz B Lote 1 ",
  district: "Lima-Lima-Carabayllo",
  phones: "Telef: 607-1883 / 943-296-081 / 944-284-915",
  documentType: "BOLETA DE VENTA ELECTRONICA",
  documentNumber: "BA01-00000012",
  emissionDate: "19/02/2018",
  currency: "SOLES",
  paymentMethod: "AL CONTADO",
  clientName: "ANDRE SCOT RAMIREZ CALLA",
  clientAddress: "AV TUPAC 123",
  clientDNI: "48065873",
  seller: "ANDRE",
  items: [
    {
      quantity: 10.0,
      description: "UNI CHAPA CLASICA 250 CANTOL",
      unitPrice: 79.0,
      total: 790.0,
    },
    {
      quantity: 10.0,
      description: "UNI CHAPA CLASICA 250 CANTOL UNI CHAPA CLASICA 250 CANTOL",
      unitPrice: 79.0,
      total: 790.0,
    },
    {
      quantity: 10.0,
      description: "UNI CHAPA CLASICA 250 CANTOL UNI CHAPA CLASICA 250 CANTOL",
      unitPrice: 79.0,
      total: 790.0,
    },
    {
      quantity: 10.0,
      description:
        "UNI CHAPA CLASICA 250 CANTOL UNI CHAPA CLASICA 250 CANTOL UNI CHAPA CLASICA 250 CANTOL",
      unitPrice: 79.0,
      total: 790.0,
    },
  ],
  subtotal: 10000,
  igv: 100000,
  total: 100.0,
  son: "VEINTISEIS CON 50/100 SOLES",
  authorization:
    "Autorizado mediante Resolución de Intendencia SUNAT N° 032-005-Representación impresa de la Boleta Electrónica Descarga tu Comprobante en -http://e-consulta.sunat.gob.pe/ol-ti-itconsvalicpe/ConsValiCpe.htm",
  id: "396548",
};
const TicketDocument = () => {
  const [qrBase64, setQrBase64] = useState("");

  useEffect(() => {
    if (ticketData.qrBase64) {
      setQrBase64(ticketData.qrBase64);
      return;
    }

    if (ticketData.qrData) {
      QRCode.toDataURL(ticketData.qrData, {
        margin: 1,
        scale: 4,
      }).then((url) => setQrBase64(url));
    }
  }, [ticketData]);

  return (
    <Document>
      <Page size={[226, 700]} style={styles.page}>
        <View style={styles.header}>
          {ticketData.logo && (
            <Image src={ticketData.logo} style={styles.logo} />
          )}
          <Text style={styles.subtitle}>sss</Text>
        </View>

        <View style={styles.companyBox}>
          <Text style={styles.companyText}>{ticketData.companyName}</Text>
          <Text style={styles.companyText}>{ticketData.ruc}</Text>
          <Text style={styles.companyText}>{ticketData.address}</Text>
          <Text style={styles.companyText}>{ticketData.district}</Text>
          <Text style={styles.companyText}>{ticketData.phones}</Text>
        </View>

        <Text style={styles.sectionTitle}>{ticketData.documentType}</Text>
        <Text style={styles.ticketNumber}>{ticketData.documentNumber}</Text>

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Fecha Emision</Text>
          <Text style={styles.infoValue}>: {ticketData.emissionDate}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tipo Moneda</Text>
          <Text style={styles.infoValue}>: {ticketData.currency}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Forma Pago</Text>
          <Text style={styles.infoValue}>: {ticketData.paymentMethod}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Cliente</Text>
          <Text style={styles.infoValue}>: {ticketData.clientName}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Direccion</Text>
          <Text style={styles.infoValue}>: {ticketData.clientAddress}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>DNI</Text>
          <Text style={styles.infoValue}>: {ticketData.clientDNI}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Vendedor</Text>
          <Text style={styles.infoValue}>: {ticketData.seller}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colCant]}>Cant.</Text>
          <Text style={[styles.tableHeaderText, styles.colDesc]}>
            Descripción
          </Text>
          <Text style={[styles.tableHeaderText, styles.colPUni]}>P.Uni</Text>
          <Text style={[styles.tableHeaderText, styles.colImporte]}>
            Importe
          </Text>
        </View>

        {ticketData.items.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={styles.colCant}>{item.quantity.toFixed(2)}</Text>
            <Text style={styles.colDesc}>{item.description}</Text>
            <Text style={styles.colPUni}>{item.unitPrice.toFixed(2)}</Text>
            <Text style={styles.colImporte}>{item.total.toFixed(2)}</Text>
          </View>
        ))}

        <Text style={styles.itemsCount}>items: {ticketData.items.length}</Text>

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>SUB TOTAL:</Text>
          <Text style={styles.summaryValue}>
            S/ {ticketData.subtotal.toFixed(2)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>IGV (18.00):</Text>
          <Text style={styles.summaryValue}>
            S/ {ticketData.igv.toFixed(2)}
          </Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.summaryLabel}>IMPORTE TOTAL:</Text>
          <Text style={styles.summaryValue}>
            S/ {ticketData.total.toFixed(2)}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{ticketData.son}</Text>
          <Text style={styles.footerText}>{ticketData.authorization}</Text>
          <Text style={styles.footerText}>ID: {ticketData.id}</Text>
        </View>

        <View>
          {qrBase64 && (
            <Image
              src={qrBase64}
              style={{
                width: 80,
                height: 80,
                alignSelf: "center",
                marginTop: 10,
              }}
            />
          )}
        </View>
      </Page>
    </Document>
  );
};

export default TicketDocument;
