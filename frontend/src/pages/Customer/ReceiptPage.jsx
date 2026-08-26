import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiRequest } from "../../services/api";
import Receipt from "../../components/Booking/Receipt";
import Loader from "../../components/UI/Loader";
import Button from "../../components/UI/Button";
import toast from "react-hot-toast";

const ReceiptPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;

    const fetchBooking = async () => {
      try {
        const res = await apiRequest.get(`/bookings/${bookingId}`);
        if (active) setBooking(res.booking);
      } catch {
        if (!active) return;
        // Previously this left the page on a spinner forever.
        setFailed(true);
        toast.error("Failed to load ticket");
      }
    };

    fetchBooking();
    return () => {
      active = false;
    };
  }, [bookingId]);

  if (failed) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-prose flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="font-display text-h2 text-content">
          We couldn&apos;t load this ticket
        </h1>
        <p className="text-body text-content-secondary">
          The booking may have been removed, or it belongs to another account.
        </p>
        <Button variant="secondary" onClick={() => navigate("/my-tickets")}>
          Go to my tickets
        </Button>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Loader size="lg" message="Loading your ticket…" />
      </div>
    );
  }

  return <Receipt booking={booking} />;
};

export default ReceiptPage;
