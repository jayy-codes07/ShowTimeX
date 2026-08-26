import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { formatDateUTC, formatTime } from "../../utils/formatDate";
import logo from "./../../assets/images/Showtime_logo.png";

// @react-pdf/renderer cannot read CSS custom properties, so these literals
// mirror styles/tokens.css by hand. Keep them in step with that file.
// One theme ("Gallery"), so both keys resolve to the same palette — the
// `theme` prop is kept only so existing callers keep working.
const GALLERY = {
  pageBg: "#faf8f4", // --bg            warm paper
  cardBg: "#ffffff", // --surface
  border: "#e8e3d9", // --border        hairline
  headerBg: "#1a1714", // --primary       ink bar, white wordmark on it
  passRowBg: "#f2eee6", // --surface-sunken
  passText: "#4e4941", // --text-secondary
  admitText: "#8a6a22", // --accent        brass
  strongText: "#16130f", // --text
  mutedText: "#6e675d", // --muted
  seatBg: "#f2eee6",
  seatBorder: "#d5cec0", // --border-strong
  priceBg: "#f4f1ea", // --surface-hover
  totalText: "#8a6a22", // --accent
  footerBg: "#f2eee6",
  fallbackId: "#4e4941",
};

const paletteByTheme = { dark: GALLERY, light: GALLERY };

const getStyles = (palette) =>
  StyleSheet.create({
    page: {
      backgroundColor: palette.pageBg,
      padding: 30,
      fontFamily: "Helvetica",
    },
    card: {
      backgroundColor: palette.cardBg,
      borderRadius: 14,
      overflow: "hidden",
      borderWidth: 2,
      borderColor: palette.border,
      borderStyle: "dashed",
    },
    header: {
      backgroundColor: palette.headerBg,
      padding: 18,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    headerLabel: {
      color: "rgba(255, 255, 255, 0.9)",
      fontSize: 10,
      marginBottom: 4,
      textTransform: "uppercase",
    },
    bookingId: {
      color: "#ffffff",
      fontSize: 18,
      fontFamily: "Courier-Bold",
      letterSpacing: 1,
    },
    logo: {
      width: 100,
      height: 40,
      objectFit: "contain",
    },
    passRow: {
      backgroundColor: palette.passRowBg,
      paddingVertical: 10,
      paddingHorizontal: 20,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    passTag: {
      fontSize: 10,
      letterSpacing: 2,
      color: palette.passText,
      textTransform: "uppercase",
      fontFamily: "Helvetica-Bold",
    },
    admitTag: {
      fontSize: 10,
      letterSpacing: 1.5,
      color: palette.admitText,
      textTransform: "uppercase",
      fontFamily: "Helvetica-Bold",
    },
    section: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: palette.border,
    },
    movieTitle: {
      fontSize: 24,
      color: palette.strongText,
      fontFamily: "Helvetica-Bold",
      textAlign: "center",
      marginBottom: 20,
    },
    infoGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    infoCol: {
      width: "50%",
      marginBottom: 15,
    },
    infoColFull: {
      width: "100%",
      marginBottom: 10,
    },
    label: {
      fontSize: 9,
      color: palette.mutedText,
      textTransform: "uppercase",
      marginBottom: 4,
      letterSpacing: 0.5,
    },
    value: {
      fontSize: 12,
      color: palette.strongText,
      fontFamily: "Helvetica-Bold",
    },
    subValue: {
      fontSize: 10,
      color: palette.mutedText,
      marginTop: 2,
    },
    seatsSection: {
      padding: 20,
      alignItems: "center",
    },
    seatGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      marginBottom: 20,
    },
    seatBadge: {
      backgroundColor: palette.seatBg,
      borderWidth: 1,
      borderColor: palette.seatBorder,
      borderRadius: 4,
      paddingVertical: 6,
      paddingHorizontal: 10,
      margin: 2,
      minWidth: 40,
    },
    seatText: {
      color: palette.strongText,
      fontSize: 10,
      fontFamily: "Courier-Bold",
      textAlign: "center",
    },
    priceBox: {
      backgroundColor: palette.priceBg,
      borderRadius: 8,
      padding: 15,
      width: "80%",
      alignSelf: "center",
      borderWidth: 1,
      borderColor: palette.border,
    },
    priceRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    priceLabel: {
      fontSize: 10,
      color: palette.mutedText,
    },
    priceValue: {
      fontSize: 10,
      color: palette.mutedText,
    },
    divider: {
      borderTopWidth: 1,
      borderTopColor: palette.border,
      marginVertical: 6,
    },
    totalLabel: {
      fontSize: 12,
      color: palette.strongText,
      fontFamily: "Helvetica-Bold",
    },
    totalValue: {
      fontSize: 14,
      color: palette.totalText,
      fontFamily: "Helvetica-Bold",
    },
    footer: {
      backgroundColor: palette.footerBg,
      padding: 20,
      alignItems: "center",
      borderTopWidth: 1,
      borderTopColor: palette.border,
    },
    qrContainer: {
      backgroundColor: "#ffffff",
      padding: 8,
      borderRadius: 8,
      marginBottom: 8,
    },
    qrImage: {
      width: 100,
      height: 100,
    },
    qrFallback: {
      fontSize: 8,
      color: palette.mutedText,
      marginTop: 6,
    },
    qrFallbackId: {
      fontSize: 9,
      color: palette.fallbackId,
      marginTop: 2,
      fontFamily: "Courier-Bold",
    },
    footerText: {
      color: palette.mutedText,
      fontSize: 9,
      textTransform: "uppercase",
      letterSpacing: 1.5,
    },
    perforation: {
      borderTopWidth: 1,
      borderTopColor: palette.border,
      borderStyle: "dashed",
    },
  });

const TicketDocument = ({ booking, logoSrc, theme = "dark" }) => {
  const safeTheme = theme === "light" ? "light" : "dark";
  const styles = getStyles(paletteByTheme[safeTheme]);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerLabel}>Booking ID</Text>
              <Text style={styles.bookingId}>{booking.bookingId}</Text>
            </View>
            <Image src={logoSrc || logo} style={styles.logo} />
          </View>
          <View style={styles.passRow}>
            <Text style={styles.passTag}>Entry Pass</Text>
            <Text style={styles.admitTag}>Admit One</Text>
          </View>

          {/* Movie Info */}
          <View style={styles.section}>
            <Text style={styles.movieTitle}>{booking.movie?.title}</Text>

            <View style={styles.infoGrid}>
              <View style={styles.infoCol}>
                <Text style={styles.label}>Date</Text>
                <Text style={styles.value}>
                  {formatDateUTC(booking.show?.date)}
                </Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.label}>Time</Text>
                <Text style={styles.value}>
                  {formatTime(booking.show?.time)}
                </Text>
              </View>
              <View style={styles.infoColFull}>
                <Text style={styles.label}>Theater</Text>
                <Text style={styles.value}>{booking.show?.theater}</Text>
                <Text style={styles.subValue}>{booking.show?.location}</Text>
              </View>
            </View>
          </View>

          {/* Seats & Price */}
          <View style={styles.seatsSection}>
            <Text style={[styles.label, { marginBottom: 10 }]}>
              Selected Seats
            </Text>

            <View style={styles.seatGrid}>
              {booking.seats?.map((seat, i) => (
                <View key={i} style={styles.seatBadge}>
                  <Text style={styles.seatText}>
                    {seat.row}
                    {seat.number}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.priceBox}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>
                  Tickets ({booking.seats?.length})
                </Text>
                <Text style={styles.priceValue}>
                  Rs. {booking.basePrice?.toFixed(2)}
                </Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Tax & Fees</Text>
                <Text style={styles.priceValue}>
                  Rs.{" "}
                  {((booking.convenienceFee || 0) + (booking.tax || 0)).toFixed(
                    2,
                  )}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.priceRow}>
                <Text style={styles.totalLabel}>Total Paid</Text>
                <Text style={styles.totalValue}>
                  Rs. {booking.totalAmount?.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>

          {/* Footer QR */}
          <View style={styles.perforation} />
          <View style={styles.footer}>
            <View style={styles.qrContainer}>
              <Image
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${booking.bookingId}`}
                style={styles.qrImage}
              />
            </View>
            <Text style={styles.qrFallback}>If QR is not readable, use:</Text>
            <Text style={styles.qrFallbackId}>{booking.bookingId}</Text>
            <Text style={styles.footerText}>Scan at entrance</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default TicketDocument;
