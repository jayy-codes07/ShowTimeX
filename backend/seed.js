const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const User = require('./models/User');
const Movie = require('./models/Movie');
const Show = require('./models/Show');
const Booking = require('./models/Booking');

// Load environment variables from backend/.env even when command is run from project root
dotenv.config({ path: path.join(__dirname, '.env') });

// Connect to database
connectDB();

// Sample data
const users = [
  {
    name: 'Admin User',
    email: 'admin@cinebook.com',
    phone: '9876543210',
    password: 'Admin@123',
    role: 'admin',
  },
  {
    name: 'Rohit Solanki',
    email: 'rohit.solanki@gmail.com',
    phone: '9017362830',
    password: 'User@123',
    role: 'customer',
  },
  {
    name: 'Meera Patel',
    email: 'meera.patel@gmail.com',
    phone: '9876543211',
    password: 'User@123',
    role: 'customer',
  },
  {
    name: 'Aarav Shah',
    email: 'aarav.shah@gmail.com',
    phone: '9876543212',
    password: 'User@123',
    role: 'customer',
  },
  {
    name: 'Priya Nair',
    email: 'priya.nair@gmail.com',
    phone: '9876543213',
    password: 'User@123',
    role: 'customer',
  },
  {
    name: 'Kunal Verma',
    email: 'kunal.verma@gmail.com',
    phone: '9876543214',
    password: 'User@123',
    role: 'customer',
  },
  {
    name: 'Nisha Rao',
    email: 'nisha.rao@gmail.com',
    phone: '9876543215',
    password: 'User@123',
    role: 'customer',
  },
  {
    name: 'Vivek Trivedi',
    email: 'vivek.trivedi@gmail.com',
    phone: '9876543216',
    password: 'User@123',
    role: 'customer',
  },
  {
    name: 'Sneha Joshi',
    email: 'sneha.joshi@gmail.com',
    phone: '9876543217',
    password: 'User@123',
    role: 'customer',
  },
  {
    name: 'Harsh Mehta',
    email: 'harsh.mehta@gmail.com',
    phone: '9876543218',
    password: 'User@123',
    role: 'customer',
  },
  {
    name: 'Isha Kapoor',
    email: 'isha.kapoor@gmail.com',
    phone: '9876543219',
    password: 'User@123',
    role: 'customer',
  },
  {
    name: 'Yash Parmar',
    email: 'yash.parmar@gmail.com',
    phone: '9876543220',
    password: 'User@123',
    role: 'customer',
  },
  {
    name: 'Divya Bhatt',
    email: 'divya.bhatt@gmail.com',
    phone: '9876543221',
    password: 'User@123',
    role: 'customer',
  },
  {
    name: 'Manav Desai',
    email: 'manav.desai@gmail.com',
    phone: '9876543222',
    password: 'User@123',
    role: 'customer',
  },
];

const seatRows = ['A', 'B', 'C', 'D', 'E', 'F'];
const seatsPerRow = 20;

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const getRandomDateInLastDays = (days) => {
  const now = new Date();
  const date = new Date(now);
  date.setDate(now.getDate() - getRandomInt(0, days - 1));
  date.setHours(getRandomInt(8, 23), getRandomInt(0, 59), getRandomInt(0, 59), 0);
  return date;
};

const pickSeatsForShow = (showId, count, occupiedMap) => {
  const key = String(showId);
  const occupied = occupiedMap.get(key) || new Set();
  const selected = [];
  const maxAttempts = 500;
  let attempts = 0;

  while (selected.length < count && attempts < maxAttempts) {
    attempts += 1;
    const row = seatRows[getRandomInt(0, seatRows.length - 1)];
    const number = getRandomInt(1, seatsPerRow);
    const seatKey = `${row}-${number}`;

    if (!occupied.has(seatKey)) {
      occupied.add(seatKey);
      selected.push({ row, number });
    }
  }

  occupiedMap.set(key, occupied);
  return selected;
};

// Seed database
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');

    const shouldReset = process.argv.includes('--reset');

    // Reset only when explicitly requested: node backend/seed.js --reset
    if (shouldReset) {
      console.log('🗑️  Reset mode enabled. Clearing existing seedable data...');
      await Booking.deleteMany();
      await Show.updateMany({}, { $set: { bookedSeats: [], seatLocks: [] } });
      await User.deleteMany({ role: 'customer' });
      console.log(' Existing data cleared\n');
    } else {
      console.log('  Safe mode enabled. Existing data will be preserved. Use --reset to clear data.\n');
    }

    // Create users
    console.log('👥 Creating users...');
    const createdUsers = [];
    for (const userData of users) {
      const existing = await User.findOne({ email: userData.email }).select('+password');
      if (existing) {
        existing.name = userData.name;
        existing.phone = userData.phone;
        existing.role = userData.role;
        existing.password = userData.password;
        await existing.save();
        createdUsers.push(existing);
      } else {
        const created = await User.create(userData);
        createdUsers.push(created);
      }
    }
    console.log(` Created ${createdUsers.length} users\n`);

    // Reuse existing shows; create fallback shows only when there are none
    console.log('🎭 Loading existing shows...');
    let createdShows = await Show.find({ isActive: true });

    const theaters = [
      { name: 'PVR Cinemas', location: 'Ahmedabad Central Mall' },
      { name: 'INOX', location: 'Alpha One Mall' },
      { name: 'Cinepolis', location: 'Himalaya Mall' },
      { name: 'Carnival Cinemas', location: 'Motera' },
    ];

    const timeslots = ['09:00 AM', '12:30 PM', '03:45 PM', '06:30 PM', '09:45 PM'];
    const formats = ['2D', '3D', 'IMAX'];

    // Get next 7 days
    const today = new Date();
    if (createdShows.length === 0) {
      console.log(' No shows found. Creating fallback shows from existing movies...');
      const nowShowingMovies = await Movie.find({ status: 'NOW_SHOWING', isActive: true });

      if (nowShowingMovies.length === 0) {
        throw new Error('No existing NOW_SHOWING movies found. Please add movies/shows first.');
      }

      const shows = [];
      for (let i = 0; i < 7; i++) {
        const showDate = new Date(today);
        showDate.setDate(today.getDate() + i);

        for (const movie of nowShowingMovies) {
          const numShows = Math.floor(Math.random() * 2) + 2;

          for (let j = 0; j < numShows; j++) {
            const theater = theaters[Math.floor(Math.random() * theaters.length)];
            const time = timeslots[Math.floor(Math.random() * timeslots.length)];
            const format = formats[Math.floor(Math.random() * formats.length)];
            const basePrice = 200;
            const formatMultiplier = format === 'IMAX' ? 1.5 : format === '3D' ? 1.3 : 1;

            shows.push({
              movie: movie._id,
              date: showDate,
              time,
              theater: theater.name,
              location: theater.location,
              format,
              price: Math.round(basePrice * formatMultiplier),
              totalSeats: 120,
              bookedSeats: [],
            });
          }
        }
      }

      createdShows = await Show.create(shows);
    }
    console.log(` Loaded ${createdShows.length} shows\n`);

    // Create realistic bookings from different users
    console.log('🎟️  Creating bookings...');
    const customerUsers = createdUsers.filter((u) => u.role === 'customer');
    const showSeatMap = new Map();
    const createdBookings = [];

    for (const customer of customerUsers) {
      const bookingsForUser = getRandomInt(4, 8);

      for (let i = 0; i < bookingsForUser; i++) {
        const show = createdShows[getRandomInt(0, createdShows.length - 1)];
        const seatCount = getRandomInt(1, 4);
        const seats = pickSeatsForShow(show._id, seatCount, showSeatMap);

        if (seats.length === 0) {
          continue;
        }

        const booking = new Booking({
          bookingId: `BK-${Date.now()}-${Math.floor(10000 + Math.random() * 90000)}`,
          user: customer._id,
          movie: show.movie,
          show: show._id,
          seats,
          email: customer.email,
          phone: customer.phone,
          status: 'confirmed',
          paymentStatus: 'completed',
          paymentMethod: 'razorpay',
          paymentId: `pay_seed_${Math.random().toString(36).slice(2, 10)}`,
          orderId: `order_seed_${Math.random().toString(36).slice(2, 10)}`,
          bookingDate: getRandomDateInLastDays(7),
        });

        booking.calculateTotal(show.price, seats.length);
        await booking.save();

        // Keep show seat matrix in sync with created bookings
        show.bookedSeats.push({
          date: show.date,
          time: show.time,
          seats,
        });
        await show.save();

        createdBookings.push(booking);
      }
    }

    // Mark users as logged in recently so user insights look active
    await User.updateMany(
      { role: 'customer' },
      { $set: { lastLoginAt: getRandomDateInLastDays(3) } }
    );

    console.log(` Created ${createdBookings.length} bookings\n`);

    console.log('═══════════════════════════════════════');
    console.log('🎉 DATABASE SEEDING COMPLETED! 🎉');
    console.log('═══════════════════════════════════════');
    console.log('\n📊 Summary:');
    console.log(`   👥 Users: ${createdUsers.length}`);
    console.log(`   🎬 Movies: ${await Movie.countDocuments()}`);
    console.log(`   🎭 Shows: ${createdShows.length}`);
    console.log(`   🎟️  Bookings: ${createdBookings.length}`);
    console.log('\n🔐 Login Credentials:');
    console.log('   Admin: admin@cinebook.com / Admin@123');
    console.log('   Demo users: rohit.solanki@gmail.com / User@123');
    console.log('   Demo users: meera.patel@gmail.com / User@123');
    console.log('═══════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeder
seedDatabase();