import React, { createContext, useState, useContext, useCallback } from 'react';

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

  // Replace the entire seat selection.
  //
  // SeatMap owns an external store that drives seat-map rendering; it mirrors
  // every mutation here so the payment/booking flow has a single value to read.
  // Stable identity (empty deps) so SeatMap can depend on it safely; the show
  // price is read from `prev` to avoid a stale closure.
  const updateSelectedSeats = useCallback((seats) => {
    const selectedSeats = Array.isArray(seats) ? seats : [];

    setBookingData((prev) => ({
      ...prev,
      selectedSeats,
      totalPrice: selectedSeats.length * (prev.show?.price || 0),
    }));
  }, []);

  // Merge a freshly fetched show into the stored snapshot.
  //
  // The Payment page keeps the show object it was handed by the showtime list,
  // so its availability goes stale the moment anyone else books. This adopts
  // only the availability fields, leaving price/date/theater untouched.
  const updateShowAvailability = useCallback((nextShow) => {
    if (!nextShow) return;

    setBookingData((prev) => {
      if (!prev.show) return prev;
      const show = { ...prev.show };

      if (Array.isArray(nextShow.bookedSeats)) {
        show.bookedSeats = nextShow.bookedSeats;
      }

      // Lock fields travel as a set: without myLockedSeats we cannot tell the
      // user's own locks apart from other people's, and the seat map would
      // discard their current selection. Adopt both or neither.
      if (Array.isArray(nextShow.lockedSeats) && Array.isArray(nextShow.myLockedSeats)) {
        show.lockedSeats = nextShow.lockedSeats;
        show.myLockedSeats = nextShow.myLockedSeats;
        show.myLockExpiresAt = nextShow.myLockExpiresAt ?? null;
      }

      return { ...prev, show };
    });
  }, []);

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
    updateSelectedSeats,
    updateShowAvailability,
    clearBooking,
    getBookingSummary,
    updateShowLocks: (lockedSeats = [], myLockedSeats = [], myLockExpiresAt = null) =>
      setBookingData((prev) => ({
        ...prev,
        show: prev.show
          ? { ...prev.show, lockedSeats, myLockedSeats, myLockExpiresAt }
          : prev.show,
      })),
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
