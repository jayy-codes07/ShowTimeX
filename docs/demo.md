# Demo Walkthrough

This is a short, faculty‑friendly flow that shows core features in under 5 minutes.

## 1. Start Services
1. Backend: `cd backend` then `npm run dev`
2. Frontend: `cd frontend` then `npm run dev`

## 2. Seed Demo Data
1. `cd backend`
2. `npm run seed`

## 3. Admin Flow
1. Login as admin using `admin@cinebook.com / Admin@123`
2. Navigate to Admin Dashboard and verify stats and charts
3. Go to Manage Movies and create or update a movie
4. Go to Manage Shows and generate showtimes

## 4. User Flow
1. Login as user using `user@cinebook.com / User@123`
2. Open a movie, select a date and showtime
3. Select seats and verify they lock with a countdown
4. Proceed to checkout and complete payment
5. Download the ticket and show the QR code

## 5. Quick Notes for Evaluators
1. Seat locking prevents two users from booking the same seat.
2. Payment verification rechecks seat availability before confirmation.
3. Reports summarize revenue, bookings, and top movies.
