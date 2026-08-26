import React, { useState } from 'react';
import { Download, Home, Printer, Check, Ticket as TicketIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  formatDateUTC,
  formatTime,
  formatDateFull,
  formatDuration,
} from '../../utils/formatDate';
import Button from '../UI/Button';
import toast from 'react-hot-toast';
import logo from './../../assets/images/Showtime_logo.png';

/**
 * Receipt — the ticket.
 *
 * Designed as a physical admission stub rather than a summary card: poster
 * head, hairline detail bands, a punched perforation, and a tear-off stub
 * carrying the QR and a vertical ADMIT ONE rail. Styling lives in
 * src/styles/receipt.css; every colour resolves to a token.
 *
 * The PDF export (TicketDocument) is unchanged and still lazy-loaded.
 */

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

// show.date is a date-only value, so read the weekday in UTC to match
// formatDateUTC — otherwise a late show flips to the previous day.
const weekdayUTC = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? '' : WEEKDAYS[d.getUTCDay()];
};

const STATUS_TONE = {
  confirmed: 'border-success bg-success-soft text-success',
  pending: 'border-warning bg-warning-soft text-warning',
  cancelled: 'border-error bg-error-soft text-error',
  expired: 'border-line-strong bg-surface-hover text-content-muted',
};

const PAYMENT_LABEL = {
  razorpay: 'Razorpay',
  stripe: 'Stripe',
  wallet: 'Wallet',
  cash: 'Cash',
};

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

/** One labelled field in the show band. */
const Field = ({ label, value, sub }) => (
  <div className="px-5 py-4 sm:px-6">
    <dt className="ticket-label">{label}</dt>
    <dd className="ticket-value mt-1.5">{value || '—'}</dd>
    {sub ? <p className="mt-0.5 text-body-sm text-content-muted">{sub}</p> : null}
  </div>
);

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
      const whiteLogo = await createWhiteLogoDataUrl(logo);
      const doc = (
        <TicketDocument booking={booking} logoSrc={whiteLogo} theme="light" />
      );
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

  const seats = booking.seats || [];
  const movie = booking.movie || {};
  const show = booking.show || {};
  const status = (booking.status || 'confirmed').toLowerCase();
  const isCancelled = status === 'cancelled' || status === 'expired';
  const bookingCode = booking.bookingId || '—';

  const languages = (movie.languages || []).slice(0, 3).join(' · ');
  const meta = [
    movie.duration ? formatDuration(movie.duration) : null,
    languages || null,
    show.format || null,
  ]
    .filter(Boolean)
    .join('  ·  ');

  const fees = (booking.convenienceFee || 0) + (booking.tax || 0);
  const paidWith = PAYMENT_LABEL[booking.paymentMethod] || booking.paymentMethod;

  return (
    <div className="receipt-page mx-auto w-full max-w-[44rem] px-4 pb-16 pt-8 sm:pt-12">
      {/* Confirmation */}
      <header className="mb-8 text-center sm:mb-10">
        <span
          className={`mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full border ${
            isCancelled
              ? 'border-error bg-error-soft text-error'
              : 'border-accent bg-accent-soft text-accent'
          }`}
          aria-hidden="true"
        >
          {isCancelled ? (
            <TicketIcon className="h-5 w-5" />
          ) : (
            <Check className="h-5 w-5" strokeWidth={2.5} />
          )}
        </span>
        <h1 className="font-display text-h1 text-content">
          {isCancelled ? 'Booking cancelled' : 'Booking confirmed'}
        </h1>
        <p className="mx-auto mt-2 max-w-prose text-body text-content-secondary">
          {isCancelled
            ? 'This ticket is no longer valid for entry.'
            : `Your ticket is ready. We also sent a copy to ${booking.email || booking.user?.email || 'your email'}.`}
        </p>
      </header>

      {/* THE TICKET */}
      <article className="ticket" aria-label="Cinema ticket">
        {/* Poster head — dark ground, so tokens flip inside it */}
        <div data-on-media className="ticket-hero">
          <div
            className="ticket-hero-bg"
            style={
              movie.poster ? { backgroundImage: `url(${movie.poster})` } : undefined
            }
            aria-hidden="true"
          />
          <div className="ticket-hero-scrim" aria-hidden="true" />

          <div className="relative flex items-start gap-4 p-5 sm:gap-6 sm:p-7">
            {movie.poster ? (
              <img
                src={movie.poster}
                alt=""
                className="ticket-poster"
                loading="lazy"
              />
            ) : null}

            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-start justify-between gap-3">
                <p className="ticket-label !text-content-media-secondary">
                  Admit {seats.length || 1}
                </p>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase leading-none tracking-wider ${
                    STATUS_TONE[status] || STATUS_TONE.confirmed
                  }`}
                >
                  {status}
                </span>
              </div>

              <h2 className="font-display text-[1.6rem] leading-[1.1] text-content-media sm:text-[2rem]">
                {movie.title || 'Your movie'}
              </h2>

              {meta ? (
                <p className="mt-2 text-body-sm text-content-media-secondary">
                  {meta}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Show */}
        <dl className="ticket-grid">
          <Field
            label="Date"
            value={formatDateUTC(show.date)}
            sub={weekdayUTC(show.date)}
          />
          <Field label="Time" value={formatTime(show.time)} sub="Doors 20 min prior" />
          <Field label="Screen" value={show.format || '2D'} />
        </dl>

        {/* Theatre */}
        <div className="ticket-row px-5 py-4 sm:px-6">
          <p className="ticket-label">Theatre</p>
          <p className="ticket-value mt-1.5">{show.theater || '—'}</p>
          {show.location ? (
            <p className="mt-0.5 text-body-sm capitalize text-content-muted">
              {show.location}
            </p>
          ) : null}
        </div>

        {/* Seats + guest */}
        <div className="ticket-row flex flex-col gap-5 px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
          <div>
            <p className="ticket-label">
              {seats.length > 1 ? 'Seats' : 'Seat'}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {seats.length ? (
                seats.map((seat, index) => (
                  <span key={`${seat.row}${seat.number}-${index}`} className="ticket-seat">
                    {seat.row}
                    {seat.number}
                  </span>
                ))
              ) : (
                <span className="text-body-sm text-content-muted">—</span>
              )}
            </div>
          </div>

          <div className="sm:text-right">
            <p className="ticket-label">Booked by</p>
            <p className="ticket-value mt-1.5">{booking.user?.name || '—'}</p>
            {booking.phone || booking.user?.phone ? (
              <p className="mt-0.5 text-body-sm text-content-muted">
                {booking.phone || booking.user?.phone}
              </p>
            ) : null}
          </div>
        </div>

        {/* Money */}
        <div className="ticket-row px-5 py-4 sm:px-6">
          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-4 text-body-sm text-content-secondary">
              <span>Tickets ({seats.length || 0})</span>
              <span className="money-value">
                ₹{(booking.basePrice || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-4 text-body-sm text-content-secondary">
              <span>Convenience fee &amp; GST</span>
              <span className="money-value">₹{fees.toFixed(2)}</span>
            </div>
          </div>

          <div className="mt-3 flex items-baseline justify-between gap-4 border-t border-line pt-3">
            <span className="ticket-label !text-content">Total paid</span>
            <span className="money-value font-display text-[1.75rem] leading-none text-content">
              ₹{(booking.totalAmount || 0).toFixed(2)}
            </span>
          </div>

          {paidWith ? (
            <p className="mt-2 text-body-sm text-content-muted">
              Paid with {paidWith}
              {booking.paymentId ? ` · ${booking.paymentId}` : ''}
            </p>
          ) : null}
        </div>

        {/* Tear line */}
        <div className="ticket-perf" aria-hidden="true" />

        {/* Stub */}
        <div className="ticket-stub">
          <div className="ticket-rail" aria-hidden="true">
            <span>Admit one</span>
          </div>

          <div className="flex flex-1 flex-col items-center gap-4 p-5 text-center sm:flex-row sm:items-center sm:gap-6 sm:p-6 sm:text-left">
            {!qrError ? (
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=0&data=${encodeURIComponent(
                  bookingCode,
                )}`}
                alt={`QR code for booking ${bookingCode}`}
                className="ticket-qr shrink-0"
                crossOrigin="anonymous"
                onError={() => setQrError(true)}
              />
            ) : (
              <div className="ticket-qr flex shrink-0 items-center justify-center px-2 text-center text-[11px] font-semibold text-content-muted">
                QR unavailable — show the code
              </div>
            )}

            <div className="min-w-0">
              <p className="ticket-label">Booking ID</p>
              <p className="ticket-code mt-1.5 text-body text-content">{bookingCode}</p>
              <p className="mt-2 text-body-sm text-content-secondary">
                Scan at the entrance. Carry a photo ID.
              </p>
              {booking.bookingDate ? (
                <p className="mt-1 text-body-sm text-content-muted">
                  Booked {formatDateFull(booking.bookingDate)}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </article>

      {/* Actions — not part of the ticket, and never printed */}
      <div className="ticket-actions mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button
          variant="primary"
          onClick={handleDownload}
          loading={downloading}
          loadingText="Generating PDF..."
          icon={<Download className="h-5 w-5" />}
          className="w-full sm:w-auto"
        >
          Download ticket
        </Button>
        <Button
          variant="secondary"
          onClick={() => window.print()}
          icon={<Printer className="h-5 w-5" />}
          className="w-full sm:w-auto"
        >
          Print
        </Button>
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          icon={<Home className="h-5 w-5" />}
          className="w-full sm:w-auto"
        >
          Back to home
        </Button>
      </div>

      <p className="mt-6 text-center text-body-sm text-content-muted">
        Ticket is valid only for the show above. Cancellations follow the refund
        policy.
      </p>
    </div>
  );
};

export default Receipt;
