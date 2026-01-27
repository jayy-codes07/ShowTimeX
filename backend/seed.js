const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');
const Movie = require('./models/Movie');
const Show = require('./models/Show');
const Booking = require('./models/Booking');

// Load environment variables
dotenv.config();

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
    name: 'John Doe',
    email: 'user@cinebook.com',
    phone: '9876543211',
    password: 'User@123',
    role: 'customer',
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '9876543212',
    password: 'User@123',
    role: 'customer',
  },
];

const movies = [
  {
    title: 'Inception',
    description: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
    genres: ['Action', 'Sci-Fi', 'Thriller'],
    languages: ['English', 'Hindi'],
    duration: 148,
    releaseDate: new Date('2010-07-16'),
    rating: 8.8,
    certificate: 'UA',
    director: 'Christopher Nolan',
    cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Ellen Page'],
    poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=300&h=450&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1920&h=1080&fit=crop',
    status: 'NOW_SHOWING',
  },
  {
    title: 'The Dark Knight',
    description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests.',
    genres: ['Action', 'Crime', 'Drama'],
    languages: ['English', 'Hindi', 'Tamil'],
    duration: 152,
    releaseDate: new Date('2008-07-18'),
    rating: 9.0,
    certificate: 'UA',
    director: 'Christopher Nolan',
    cast: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart'],
    poster: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=300&h=450&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1920&h=1080&fit=crop',
    status: 'NOW_SHOWING',
  },
  {
    title: 'Interstellar',
    description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.',
    genres: ['Adventure', 'Drama', 'Sci-Fi'],
    languages: ['English', 'Hindi'],
    duration: 169,
    releaseDate: new Date('2014-11-07'),
    rating: 8.6,
    certificate: 'UA',
    director: 'Christopher Nolan',
    cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain'],
    poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=450&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920&h=1080&fit=crop',
    status: 'NOW_SHOWING',
  },
  {
    title: 'Avengers: Endgame',
    description: 'After the devastating events of Avengers: Infinity War, the universe is in ruins. With the help of remaining allies, the Avengers assemble once more.',
    genres: ['Action', 'Adventure', 'Sci-Fi'],
    languages: ['English', 'Hindi', 'Tamil', 'Telugu'],
    duration: 181,
    releaseDate: new Date('2019-04-26'),
    rating: 8.4,
    certificate: 'UA',
    director: 'Anthony Russo, Joe Russo',
    cast: ['Robert Downey Jr.', 'Chris Evans', 'Scarlett Johansson'],
    poster: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=300&h=450&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=1920&h=1080&fit=crop',
    status: 'NOW_SHOWING',
  },
  {
    title: 'Spider-Man: Beyond Reality',
    description: 'Peter Parker discovers new dimensions and faces challenges that test his abilities beyond imagination.',
    genres: ['Action', 'Adventure', 'Fantasy'],
    languages: ['English', 'Hindi'],
    duration: 135,
    releaseDate: new Date('2025-06-15'),
    rating: 0,
    certificate: 'UA',
    director: 'Jon Watts',
    cast: ['Tom Holland', 'Zendaya', 'Benedict Cumberbatch'],
    poster: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=300&h=450&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=1920&h=1080&fit=crop',
    status: 'COMING_SOON',
  },
  {
    title: 'The Matrix Resurrections',
    description: 'Return to a world of two realities: one, everyday life; the other, what lies behind it.',
    genres: ['Action', 'Sci-Fi'],
    languages: ['English', 'Hindi'],
    duration: 148,
    releaseDate: new Date('2025-08-20'),
    rating: 0,
    certificate: 'UA',
    director: 'Lana Wachowski',
    cast: ['Keanu Reeves', 'Carrie-Anne Moss', 'Yahya Abdul-Mateen II'],
    poster: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=300&h=450&fit=crop',
    backdrop: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1920&h=1080&fit=crop',
    status: 'COMING_SOON',
  },
];

// Seed database
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany();
    await Movie.deleteMany();
    await Show.deleteMany();
    await Booking.deleteMany();
    console.log('✅ Existing data cleared\n');

    // Create users
    console.log('👥 Creating users...');
    const createdUsers = await User.create(users);
    console.log(`✅ Created ${createdUsers.length} users\n`);

    // Create movies
    console.log('🎬 Creating movies...');
    const createdMovies = await Movie.create(movies);
    console.log(`✅ Created ${createdMovies.length} movies\n`);

    // Create shows for NOW_SHOWING movies
    console.log('🎭 Creating shows...');
    const shows = [];
    const nowShowingMovies = createdMovies.filter(m => m.status === 'NOW_SHOWING');

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
    for (let i = 0; i < 7; i++) {
      const showDate = new Date(today);
      showDate.setDate(today.getDate() + i);

      for (const movie of nowShowingMovies) {
        // Create 2-3 shows per day per movie
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

    const createdShows = await Show.create(shows);
    console.log(`✅ Created ${createdShows.length} shows\n`);

    console.log('═══════════════════════════════════════');
    console.log('🎉 DATABASE SEEDING COMPLETED! 🎉');
    console.log('═══════════════════════════════════════');
    console.log('\n📊 Summary:');
    console.log(`   👥 Users: ${createdUsers.length}`);
    console.log(`   🎬 Movies: ${createdMovies.length}`);
    console.log(`   🎭 Shows: ${createdShows.length}`);
    console.log('\n🔐 Login Credentials:');
    console.log('   Admin: admin@cinebook.com / Admin@123');
    console.log('   User:  user@cinebook.com / User@123');
    console.log('═══════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeder
seedDatabase();