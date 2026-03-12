# ShowTimeX

ShowTimeX is a full‑stack movie ticket booking platform with real‑time seat locking, payments, and admin analytics.

**Highlights**
1. Real‑time seat locking to prevent double booking.
2. Admin dashboard with revenue and performance reports.
3. Ticket download with QR code for entry verification.
4. Light/dark theme toggle for better usability.

**Tech Stack**
1. Frontend: React, Vite, TailwindCSS, Framer Motion
2. Backend: Node.js, Express, MongoDB, Mongoose
3. Payments: Razorpay

**Quick Start**
1. Backend
   1. `cd backend`
   2. `npm install`
   3. Create `backend/.env` (see `.env` template below)
   4. `npm run dev`
2. Frontend
   1. `cd frontend`
   2. `npm install`
   3. Create `frontend/.env` (see `.env` template below)
   4. `npm run dev`

**Seed Demo Data**
1. `cd backend`
2. `npm run seed`

This seeds demo users and movies. See [docs/demo.md](docs/demo.md) for a step‑by‑step demo flow.

**Demo Credentials (after seeding)**
1. Admin: `admin@cinebook.com` / `Admin@123`
2. User: `user@cinebook.com` / `User@123`

**Seat Locking**
Seats are locked for a short time when a user selects them. This prevents double booking while they complete payment. The UI shows a countdown timer and indicates seats locked by other users.

**Environment Variables**

Backend `backend/.env`:
```
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
TMDB_API_KEY=your_key
N8N_WEBHOOK_URL=http://localhost:5678/webhook
SEAT_LOCK_MINUTES=10
```

Frontend `frontend/.env`:
```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY=your_key
```

**Documentation**
1. Architecture, ER diagram, and sequence diagrams: [docs/diagrams.md](docs/diagrams.md)
2. Demo walkthrough: [docs/demo.md](docs/demo.md)
