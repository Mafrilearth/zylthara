import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
    position: "relative",
  },
  watermark: {
    position: "absolute",
    top: 240,
    left: 80,
    fontSize: 78,
    color: "#e2e8f0",
    opacity: 0.35,
    transform: "rotate(-35deg)",
    fontWeight: "bold",
    letterSpacing: 8,
  },
  outerBorder: {
    border: "3pt solid #0f172a",
    padding: 16,
    height: "100%",
  },
  innerBorder: {
    border: "1pt solid #cbd5e1",
    padding: 24,
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  header: {
    textAlign: "center",
    marginBottom: 16,
  },
  orgTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  subTitle: {
    fontSize: 10,
    color: "#0284c7",
    marginTop: 4,
    fontWeight: "bold",
    letterSpacing: 1.5,
  },
  divider: {
    borderBottomWidth: 1.5,
    borderColor: "#0f172a",
    marginVertical: 12,
  },
  certTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 8,
  },
  recipientText: {
    fontSize: 10,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 4,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0f172a",
    textAlign: "center",
    marginVertical: 8,
    textDecoration: "underline",
  },
  statement: {
    fontSize: 10,
    color: "#334155",
    textAlign: "center",
    lineHeight: 1.5,
    marginHorizontal: 30,
    marginBottom: 16,
  },
  scoreTable: {
    border: "1pt solid #cbd5e1",
    borderRadius: 4,
    marginHorizontal: 20,
    marginVertical: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderColor: "#cbd5e1",
    padding: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    padding: 8,
  },
  tableRowTotal: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    padding: 10,
  },
  colSection: {
    width: "70%",
    fontSize: 10,
    color: "#1e293b",
  },
  colScore: {
    width: "30%",
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "right",
    color: "#0f172a",
  },
  totalScoreText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#0284c7",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: "#e2e8f0",
  },
  metaContainer: {
    width: "60%",
    gap: 3,
  },
  metaLabel: {
    fontSize: 8,
    color: "#64748b",
  },
  metaValue: {
    fontSize: 9,
    color: "#0f172a",
    fontWeight: "bold",
  },
  qrContainer: {
    width: "40%",
    alignItems: "flex-end",
  },
  qrCode: {
    width: 65,
    height: 65,
  },
  qrLabel: {
    fontSize: 7,
    color: "#64748b",
    marginTop: 4,
    textAlign: "right",
  },
});

export interface CertificateData {
  testTakerName: string;
  testDate: string;
  certificateNo: string;
  verificationCode: string;
  listeningScore: number;
  structureScore: number;
  readingScore: number;
  totalScore: number;
  qrCodeDataUrl: string;
}

export function CertificateDocument({ data }: { data: CertificateData }) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Text style={styles.watermark}>SPECIMEN</Text>
        <View style={styles.outerBorder}>
          <View style={styles.innerBorder}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.orgTitle}>Zylthara Institutional Test Integrity Engine</Text>
              <Text style={styles.subTitle}>STANDARDIZED INSTITUTIONAL ENGLISH PROFICIENCY CERTIFICATE</Text>
            </View>

            <View style={styles.divider} />

            {/* Test Taker Info */}
            <View>
              <Text style={styles.recipientText}>This official institutional certificate is proudly awarded to:</Text>
              <Text style={styles.name}>{data.testTakerName}</Text>
              <Text style={styles.statement}>
                for demonstrating standardized English language proficiency under supervised digital test integrity
                telemetry, administered on {data.testDate}.
              </Text>
            </View>

            {/* Score Breakdown Table */}
            <View style={styles.scoreTable}>
              <View style={styles.tableHeader}>
                <Text style={styles.colSection}>Assessed Test Section</Text>
                <Text style={styles.colScore}>Scaled Score</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.colSection}>Section 1: Listening Comprehension (Scale: 31 - 68)</Text>
                <Text style={styles.colScore}>{data.listeningScore}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.colSection}>Section 2: Structure & Written Expression (Scale: 31 - 68)</Text>
                <Text style={styles.colScore}>{data.structureScore}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.colSection}>Section 3: Reading Comprehension (Scale: 31 - 67)</Text>
                <Text style={styles.colScore}>{data.readingScore}</Text>
              </View>
              <View style={styles.tableRowTotal}>
                <Text style={[styles.colSection, styles.totalScoreText]}>Total Scaled Score (Scale: 310 - 677)</Text>
                <Text style={[styles.colScore, styles.totalScoreText]}>{data.totalScore}</Text>
              </View>
            </View>

            {/* Footer with Metadata & QR Code */}
            <View style={styles.footer}>
              <View style={styles.metaContainer}>
                <Text style={styles.metaLabel}>Certificate Number:</Text>
                <Text style={styles.metaValue}>{data.certificateNo}</Text>
                <Text style={styles.metaLabel}>Digital Verification Code:</Text>
                <Text style={styles.metaValue}>{data.verificationCode}</Text>
                <Text style={styles.metaLabel}>Institutional Integrity Authority:</Text>
                <Text style={styles.metaValue}>Zylthara Cryptographic Ledger & Audit Protocol</Text>
              </View>
              <View style={styles.qrContainer}>
                {data.qrCodeDataUrl ? (
                  // eslint-disable-next-line jsx-a11y/alt-text
                  <Image src={data.qrCodeDataUrl} style={styles.qrCode} />
                ) : null}
                <Text style={styles.qrLabel}>Scan to verify certificate authenticity</Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
