import React, { useState } from 'react';
import { Download, CheckCircle, Calendar, Clock, MapPin, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDateUTC, formatTime } from '../../utils/formatDate';
import Button from '../UI/Button';
import toast from 'react-hot-toast';
import logo from './../../assets/images/Showtime_logo.png'
import { useTheme } from '../../context/ThemeContext';

const createWhiteLogoDataUrl = (src) =>
  new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        if (!width || !height) {
          resolve(src);
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] > 0) {
            data[i] = 255;
            data[i + 1] = 255;
            data[i + 2] = 255;
          }
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(src);
      img.src = src;
    } catch {
      resolve(src);
    }
  });

const Receipt = ({ booking }) => {
  const navigate = useNavigate();
  const [qrError, setQrError] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const handleDownload = async () => {
    const toastId = toast.loading('Generating ticket...');

    try {
      setDownloading(true);
      const [{ pdf }, { default: TicketDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./TicketDocument'),
      ]);
      const whiteLogo = await createWhiteLogoDataUrl(logo);
      const doc = <TicketDocument booking={booking} logoSrc={whiteLogo} theme={theme} />;
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
        <h2 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-[var(--app-text-strong)]'}`}>Booking Confirmed!</h2>
        <p className={isDark ? 'text-gray-400' : 'text-[var(--app-text-muted)]'}>Your tickets have been booked successfully</p>
      </div>

      {/* RECEIPT CARD */}
      <div className="receipt-preview">
        <div className="receipt-preview-inner">
          <div className={`receipt-card rounded-xl overflow-hidden border-2 border-dashed relative z-10 shadow-2xl ${isDark ? 'bg-dark-card border-gray-700' : 'bg-white border-gray-300'}`}>
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
        <div className={`p-6 border-b ${isDark ? 'border-gray-700 bg-dark-card' : 'border-gray-300 bg-white'}`}>
          <h3 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-[var(--app-text-strong)]'}`}>{booking.movie?.title}</h3>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <Calendar className="w-5 h-5 text-primary mt-1" />
              <div>
                <p className={`text-xs uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Date</p>
                <p className={`font-semibold ${isDark ? 'text-white' : 'text-[var(--app-text-strong)]'}`}>{formatDateUTC(booking.show?.date)}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-primary mt-1" />
              <div>
                <p className={`text-xs uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Time</p>
                <p className={`font-semibold ${isDark ? 'text-white' : 'text-[var(--app-text-strong)]'}`}>{formatTime(booking.show?.time)}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 col-span-2">
              <MapPin className="w-5 h-5 text-primary mt-1" />
              <div>
                <p className={`text-xs uppercase tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Theater</p>
                <p className={`font-semibold ${isDark ? 'text-white' : 'text-[var(--app-text-strong)]'}`}>{booking.show?.theater}</p>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-[var(--app-text-muted)]'}`}>{booking.show?.location}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Seats & Payment */}
        <div className={isDark ? 'p-6 bg-dark-card' : 'p-6 bg-white'}>
          <div className="mb-6">
            <p className={`text-xs uppercase tracking-wider mb-2 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Selected Seats</p>
            <div className="flex flex-wrap gap-2">
              {booking.seats?.map((seat, index) => (
                <span key={index} className={`px-3 py-1 rounded font-mono text-sm border ${isDark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-800'}`}>
                  {seat.row}{seat.number}
                </span>
              ))}
            </div>
          </div>

          <div className={`rounded-lg p-4 space-y-2 ${isDark ? 'bg-gray-800/50' : 'bg-gray-100'}`}>
            <div className={`flex justify-between text-sm ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
              <span>Tickets ({booking.seats?.length})</span>
              <span>₹{booking.basePrice?.toFixed(2)}</span>
            </div>
            <div className={`flex justify-between text-sm ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
              <span>Tax & Fees</span>
              <span>₹{((booking.convenienceFee || 0) + (booking.tax || 0)).toFixed(2)}</span>
            </div>
            <div className={`border-t pt-2 mt-2 flex justify-between items-center ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
              <span className={`font-bold ${isDark ? 'text-white' : 'text-[var(--app-text-strong)]'}`}>Total Paid</span>
              <span className="money-value text-xl font-bold">₹{booking.totalAmount?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* QR Code Footer */}
        <div className="receipt-perf" />
        <div className={`p-6 flex flex-col items-center justify-center ${isDark ? 'bg-dark-card' : 'bg-white'}`}>
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
            <p className={`text-xs text-center uppercase tracking-widest ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                Scan at entrance
            </p>
            {qrError && (
              <p className={`mt-2 text-xs text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
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
