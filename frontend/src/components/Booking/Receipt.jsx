import React, { useState } from 'react';
import { Download, CheckCircle, Calendar, Clock, MapPin, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDate, formatTime } from '../../utils/formatDate';
import Button from '../UI/Button';
import toast from 'react-hot-toast';
import logo from './../../assets/images/Showtime_logo.png'

const Receipt = ({ booking }) => {
  const navigate = useNavigate();
  const [qrError, setQrError] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    const toastId = toast.loading('Generating ticket...');

    try {
      setDownloading(true);
      const [{ pdf }, { default: TicketDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./TicketDocument'),
      ]);
      const doc = <TicketDocument booking={booking} />;
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = `ShowtimeX-Ticket-${booking.bookingId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      toast.success('Ticket downloaded successfully!', { id: toastId });
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download ticket', { id: toastId });
    } finally {
      setDownloading(false);
    }
  };

  if (!booking) return null;

  return (
    // 👇 ADDED 'pt-24' to push content down below the fixed Navbar
    <div className="max-w-2xl mx-auto pt-24 pb-12 px-4">
      {/* Success Message */}
      <div className="text-center mb-8">
        <div>
         
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Booking Confirmed!</h2>
        <p className="text-gray-400">Your tickets have been booked successfully</p>
      </div>

      {/* RECEIPT CARD */}
      <div className="receipt-preview">
        <div className="receipt-preview-inner">
          <div className="receipt-card bg-dark-card rounded-xl overflow-hidden border-2 border-dashed border-gray-700 relative z-10 shadow-2xl">
            <div className="receipt-notch receipt-notch-left" />
            <div className="receipt-notch receipt-notch-right" />
            {/* Ticket Header */}
            <div className="receipt-ticket-header p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm opacity-90 mb-1">Booking ID</p>
                  <p className="text-2xl font-bold tracking-wider">{booking.bookingId || 'BK' + Date.now()}</p>
                </div>
               <img src={logo} alt="" className='h-12 bg-transparent receipt-logo-contrast' />
                
              </div>
            </div>

        {/* Movie Details */}
        <div className="p-6 border-b border-gray-700 bg-dark-card">
          <h3 className="text-2xl font-bold text-white mb-4">{booking.movie?.title}</h3>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <Calendar className="w-5 h-5 text-primary mt-1" />
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider">Date</p>
                <p className="text-white font-semibold">{formatDate(booking.show?.date)}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-primary mt-1" />
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider">Time</p>
                <p className="text-white font-semibold">{formatTime(booking.show?.time)}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 col-span-2">
              <MapPin className="w-5 h-5 text-primary mt-1" />
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider">Theater</p>
                <p className="text-white font-semibold">{booking.show?.theater}</p>
                <p className="text-gray-400 text-sm">{booking.show?.location}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Seats & Payment */}
        <div className="p-6 bg-dark-card">
          <div className="mb-6">
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Selected Seats</p>
            <div className="flex flex-wrap gap-2">
              {booking.seats?.map((seat, index) => (
                <span key={index} className="bg-gray-800 border border-gray-600 px-3 py-1 rounded text-white font-mono text-sm">
                  {seat.row}{seat.number}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-gray-400 text-sm">
              <span>Tickets ({booking.seats?.length})</span>
              <span>₹{booking.basePrice?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-400 text-sm">
              <span>Tax & Fees</span>
              <span>₹{((booking.convenienceFee || 0) + (booking.tax || 0)).toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-700 pt-2 mt-2 flex justify-between items-center">
              <span className="text-white font-bold">Total Paid</span>
              <span className="money-value text-xl font-bold">₹{booking.totalAmount?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* QR Code Footer */}
        <div className="receipt-perf" />
        <div className="p-6 bg-dark-card flex flex-col items-center justify-center">
            <div className="bg-white p-2 rounded-lg mb-3">
                 {!qrError ? (
                   <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${booking.bookingId}`} 
                      alt="Booking QR" 
                      className="w-32 h-32"
                      crossOrigin="anonymous"
                      onError={() => setQrError(true)}
                   />
                 ) : (
                   <div className="w-32 h-32 flex items-center justify-center text-center text-xs text-gray-800">
                     QR unavailable
                   </div>
                 )}
            </div>
            <p className="text-gray-500 text-xs text-center uppercase tracking-widest">
                Scan at entrance
            </p>
            {qrError && (
              <p className="mt-2 text-xs text-gray-400 text-center">
                Manual code: {booking.bookingId}
              </p>
            )}
        </div>
          </div>
        </div>
      </div>

      {/* Action Buttons (These will NOT appear in the PDF) */}
      <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
            variant="primary" 
            onClick={handleDownload} 
            loading={downloading}
            loadingText="Generating PDF..."
            icon={<Download className="w-5 h-5" />}
            className="w-full sm:w-auto"
        >
          Download Ticket
        </Button>
        <Button 
            variant="secondary" 
            onClick={() => navigate('/')}
            icon={<Home className="w-5 h-5" />}
            className="w-full sm:w-auto"
        >
          Back to Home
        </Button>
      </div>
    </div>
  );
};

export default Receipt;
