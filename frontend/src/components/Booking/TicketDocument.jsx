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
    backgroundColor: "#111111", // Main dark background
    padding: 30,
    fontFamily: "Helvetica",
  },
  card: {
    backgroundColor: "#1a1a1a", // Your 'bg-dark-card'
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#374151", // border-gray-700
    borderStyle: "dashed",
  },

  // --- HEADER ---
  header: {
    backgroundColor: "#DC2626", // Replaces gradient (PDF doesn't support gradients easily)
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLabel: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 10,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  bookingId: {
    color: "#ffffff",
    fontSize: 18,
    fontFamily: "Courier-Bold", // Monospace font for ID
    letterSpacing: 1,
  },
  logo: {
    width: 100,
    height: 40,
    objectFit: "contain",
  },

  // --- MOVIE INFO ---
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#374151", // border-gray-700
  },
  movieTitle: {
    fontSize: 24,
    color: "#ffffff",
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
    color: "#9CA3AF", // text-gray-400
    textTransform: "uppercase",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 12,
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
  },
  subValue: {
    fontSize: 10,
    color: "#9CA3AF",
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
    gap: 5, // Note: 'gap' works in newer react-pdf versions, otherwise use margin
  },
  seatBadge: {
    backgroundColor: "#1F2937", // bg-gray-800
    borderWidth: 1,
    borderColor: "#4B5563", // border-gray-600
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    margin: 2,
    minWidth: 40,
  },
  seatText: {
    color: "#ffffff",
    fontSize: 10,
    fontFamily: "Courier-Bold",
    textAlign: "center",
  },

  // --- PRICE BOX ---
  priceBox: {
    backgroundColor: "rgba(31, 41, 55, 0.5)", // bg-gray-800/50
    borderRadius: 8,
    padding: 15,
    width: "80%", // Limit width like 'max-w-sm'
    alignSelf: "center",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  priceLabel: {
    fontSize: 10,
    color: "#9CA3AF",
  },
  priceValue: {
    fontSize: 10,
    color: "#9CA3AF",
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: "#374151",
    marginVertical: 6,
  },
  totalLabel: {
    fontSize: 12,
    color: "#ffffff",
    fontFamily: "Helvetica-Bold",
  },
  totalValue: {
    fontSize: 14,
    color: "#DC2626", // text-primary (red)
    fontFamily: "Helvetica-Bold",
  },

  // --- FOOTER (QR) ---
  footer: {
    backgroundColor: "#151515",
    padding: 20,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#374151",
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
    color: "#6B7280", // text-gray-500
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.5,
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
