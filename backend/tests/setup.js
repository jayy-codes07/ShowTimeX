// Loaded via `node --test --require ./tests/setup.js` before every test file.
// Sets a hermetic environment so no test can reach a real database, Razorpay
// account, Redis or SMTP server. server.js (which loads .env) is never
// required by tests; they import app.js directly.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.JWT_EXPIRE = '1h';
process.env.RAZORPAY_KEY_ID = 'rzp_test_dummy';
process.env.RAZORPAY_KEY_SECRET = 'test_razorpay_secret';
process.env.CLIENT_URL = 'http://localhost:5173';
delete process.env.MONGO_URI;
delete process.env.REDIS_URL;
delete process.env.SMTP_HOST;
delete process.env.N8N_WEBHOOK_URL;
delete process.env.TMDB_API_KEY;
