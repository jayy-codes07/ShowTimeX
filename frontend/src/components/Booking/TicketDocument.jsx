import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { formatDate, formatTime } from "../../utils/formatDate";
import logo from "./../../assets/images/Showtime_logo.png";

// Define the Dark Theme Styles
const styles = StyleSheet.create({
  page: {
    backgroundColor: "#f1faee",
    padding: 30,
    fontFamily: "Helvetica",
  },
  card: {
    backgroundColor: "#f1faee",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#457b9d",
    borderStyle: "dashed",
  },

  // --- HEADER ---
  header: {
    backgroundColor: "#1d3557",
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLabel: {
    color: "rgba(241, 250, 238, 0.85)",
    fontSize: 10,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  bookingId: {
    color: "#f1faee",
    fontSize: 18,
    fontFamily: "Courier-Bold", // Monospace font for ID
    letterSpacing: 1,
  },
  logo: {
    width: 100,
    height: 40,
    objectFit: "contain",
  },
  passRow: {
    backgroundColor: "rgba(168, 218, 220, 0.7)",
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  passTag: {
    fontSize: 10,
    letterSpacing: 2,
    color: "#1d3557",
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
  },
  admitTag: {
    fontSize: 10,
    letterSpacing: 1.5,
    color: "#e63946",
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
  },

  // --- MOVIE INFO ---
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(69, 123, 157, 0.5)",
  },
  movieTitle: {
    fontSize: 24,
    color: "#1d3557",
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
    color: "rgba(29, 53, 87, 0.75)",
    textTransform: "uppercase",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 12,
    color: "#1d3557",
    fontFamily: "Helvetica-Bold",
  },
  subValue: {
    fontSize: 10,
    color: "rgba(29, 53, 87, 0.7)",
    marginTop: 2,
  },

  // --- SEATS ---
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
    backgroundColor: "#a8dadc",
    borderWidth: 1,
    borderColor: "#457b9d",
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    margin: 2,
    minWidth: 40,
  },
  seatText: {
    color: "#1d3557",
    fontSize: 10,
    fontFamily: "Courier-Bold",
    textAlign: "center",
  },

  // --- PRICE BOX ---
  priceBox: {
    backgroundColor: "rgba(168, 218, 220, 0.5)",
    borderRadius: 8,
    padding: 15,
    width: "80%", // Limit width like 'max-w-sm'
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "rgba(69, 123, 157, 0.55)",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  priceLabel: {
    fontSize: 10,
    color: "rgba(29, 53, 87, 0.75)",
  },
  priceValue: {
    fontSize: 10,
    color: "rgba(29, 53, 87, 0.75)",
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: "rgba(69, 123, 157, 0.55)",
    marginVertical: 6,
  },
  totalLabel: {
    fontSize: 12,
    color: "#1d3557",
    fontFamily: "Helvetica-Bold",
  },
  totalValue: {
    fontSize: 14,
    color: "#e63946",
    fontFamily: "Helvetica-Bold",
  },

  // --- FOOTER (QR) ---
  footer: {
    backgroundColor: "#1d3557",
    padding: 20,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(69, 123, 157, 0.6)",
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
  footerText: {
    color: "rgba(241, 250, 238, 0.85)",
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  perforation: {
    borderTopWidth: 1,
    borderTopColor: "rgba(69, 123, 157, 0.6)",
    borderStyle: "dashed",
  },
});

const TicketDocument = ({ booking }) => {
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
            <Image src={logo} style={styles.logo} />
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
                  {formatDate(booking.show?.date)}
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
            <Text style={styles.footerText}>Scan at entrance</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default TicketDocument;
