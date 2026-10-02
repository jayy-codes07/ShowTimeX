# Demo Walkthrough

This is a short, faculty‑friendly flow that shows core features in under 5 minutes.

## 1. Start Services
1. Backend: `cd backend` then `npm run dev`
2. Frontend: `cd frontend` then `npm run dev`

## 2. Seed Demo Data
1. `cd backend`
2. `npm run seed` (dry run, writes nothing)
3. `SEED_ADMIN_PASSWORD=... SEED_CUSTOMER_PASSWORD=... npm run seed -- --confirm`

## 3. Admin Flow
1. Login as `demo.admin@example.com` with the password you set in `SEED_ADMIN_PASSWORD`
2. Navigate to Admin Dashboard and verify stats and charts
3. Go to Manage Movies and create or update a movie
4. Go to Manage Shows and generate showtimes

## 4. User Flow
1. Login as `demo.customer@example.com` with the password you set in `SEED_CUSTOMER_PASSWORD`
2. Open a movie, select a date and showtime
3. Select seats and verify they lock with a countdown
4. Proceed to checkout and pay with a Razorpay test card (see README)
5. Download the ticket and show the QR code

## 5. Quick Notes for Evaluators
1. Seat locking and final confirmation are single conditional MongoDB updates, so two users cannot book the same seat.
2. Payment verification checks the signature, the order id stored on the booking, and the captured amount fetched from Razorpay before writing seats.
3. Reports summarize revenue, bookings, and top movies.
