import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiRequest } from "../../services/api";
import Receipt from "../../components/Booking/Receipt";
import toast from "react-hot-toast";

const ReceiptPage = () => {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await apiRequest.get(`/bookings/${bookingId}`);
        
        
        setBooking(res.booking);
      } catch {
        toast.error("Failed to load ticket");
        

      }
    };
    fetchBooking();
  }, [bookingId]);

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading ticket...
      </div>
    );
  }

  return <Receipt booking={booking} />;
};

export default ReceiptPage;
