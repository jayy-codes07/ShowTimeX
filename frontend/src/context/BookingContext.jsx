import React, { createContext, useState, useContext } from 'react';
import toast from 'react-hot-toast';

const BookingContext = createContext(null);

export const BookingProvider = ({ children }) => {
  const [bookingData, setBookingData] = useState({
    movie: null,
    show: null,
    selectedSeats: [],
    totalPrice: 0,
    bookingDate: null,
  });

  // Set movie and show details
  const setMovieAndShow = (movie, show) => {
    setBookingData((prev) => ({
      ...prev,
      movie,
      show,
      selectedSeats: [],
      totalPrice: 0,
      bookingDate: new Date(),
    }));
  };

  // Add seat to selection
  const addSeat = (seat) => {
    if (bookingData.selectedSeats.length >= 10) {
      toast.error('You can select maximum 10 seats per booking');
      return false;
    }

    const isAlreadySelected = bookingData.selectedSeats.some(
      (s) => s.row === seat.row && s.number === seat.number
    );

    if (isAlreadySelected) {
      toast.error('Seat already selected');
      return false;
    }

    const updatedSeats = [...bookingData.selectedSeats, seat];
    const totalPrice = updatedSeats.length * (bookingData.show?.price || 0);

    setBookingData((prev) => ({
      ...prev,
      selectedSeats: updatedSeats,
      totalPrice,
    }));

    return true;
  };

  // Remove seat from selection
  const removeSeat = (seat) => {
    const updatedSeats = bookingData.selectedSeats.filter(
      (s) => !(s.row === seat.row && s.number === seat.number)
    );
    const totalPrice = updatedSeats.length * (bookingData.show?.price || 0);

    setBookingData((prev) => ({
      ...prev,
      selectedSeats: updatedSeats,
      totalPrice,
    }));
  };

  // Toggle seat selection
  const toggleSeat = (seat) => {
    const isSelected = bookingData.selectedSeats.some(
      (s) => s.row === seat.row && s.number === seat.number
    );

    if (isSelected) {
      removeSeat(seat);
    } else {
      addSeat(seat);
    }
  };

  // Check if seat is selected
  const isSeatSelected = (row, number) => {
    return bookingData.selectedSeats.some(
      (s) => s.row === row && s.number === number
    );
  };

  // Clear booking data
  const clearBooking = () => {
    setBookingData({
      movie: null,
      show: null,
      selectedSeats: [],
      totalPrice: 0,
      bookingDate: null,
    });
  };

  // Calculate booking summary
  const getBookingSummary = () => {
    const basePrice = bookingData.totalPrice;
    const convenienceFee = basePrice * 0.05; // 5% convenience fee
    const tax = basePrice * 0.18; // 18% tax (GST)
    const total = basePrice + convenienceFee + tax;

    return {
      basePrice,
      convenienceFee,
      tax,
      total,
      seatCount: bookingData.selectedSeats.length,
    };
  };

  const value = {
    bookingData,
    setMovieAndShow,
    addSeat,
    removeSeat,
    toggleSeat,
    isSeatSelected,
    clearBooking,
    getBookingSummary,
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};

// Custom hook to use booking context
export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};

export default BookingContext;