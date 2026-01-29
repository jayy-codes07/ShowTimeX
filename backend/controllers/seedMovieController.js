const Movie = require('../models/movie');

const seedMovies = async (req, res) => {
    try {
        await Movie.deleteMany({}); // optional reset

        const movies = [
            {
                title: "Avatar 3",
                description: "A new Na'vi tribe emerges as Pandora faces its greatest threat yet.",
                genres: ["Sci-Fi", "Adventure"],
                languages: ["English"],
                duration: 190,
                releaseDate: new Date("2025-12-19"),
                rating: 8.8,
                certificate: "UA",
                director: "James Cameron",
                cast: ["Sam Worthington", "Zoe Saldana"],
                poster: "https://image.tmdb.org/t/p/w500/6tJWxRfBKWGIPFkfLTod5B2M5rK.jpg",
                backdrop: "https://image.tmdb.org/t/p/original/9dKCd55IuTT5QRs989m9Qlb7d2B.jpg",
                status: "COMING_SOON"
            },
            {
                title: "Avengers: Secret Wars",
                description: "Heroes across the multiverse unite for the final battle.",
                genres: ["Action", "Superhero"],
                languages: ["English"],
                duration: 185,
                releaseDate: new Date("2026-05-01"),
                rating: 9.1,
                certificate: "UA",
                director: "Russo Brothers",
                cast: ["Benedict Cumberbatch", "Chris Hemsworth"],
                poster: "https://image.tmdb.org/t/p/w500/qzA87Wf4jo1h8JMk9GilyIYvwsA.jpg",
                backdrop: "https://image.tmdb.org/t/p/original/4gKyQ1McHa8ZKDsYoyKQSevF01J.jpg",
                status: "COMING_SOON"
            },
            {
                title: "Dune: Messiah",
                description: "Paul Atreides struggles with power, prophecy, and rebellion.",
                genres: ["Sci-Fi", "Drama"],
                languages: ["English"],
                duration: 170,
                releaseDate: new Date("2026-11-20"),
                rating: 8.9,
                certificate: "UA",
                director: "Denis Villeneuve",
                cast: ["Timothée Chalamet", "Zendaya"],
                poster: "https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg",
                backdrop: "https://image.tmdb.org/t/p/original/6ELJEzQJ3Y45HczvreC3dg0GV5R.jpg",
                status: "COMING_SOON"
            },
            {
                title: "Mission: Impossible – Dead Reckoning Part Two",
                description: "Ethan Hunt races against time to stop a global catastrophe.",
                genres: ["Action", "Thriller"],
                languages: ["English"],
                duration: 165,
                releaseDate: new Date("2025-06-27"),
                rating: 8.6,
                certificate: "UA",
                director: "Christopher McQuarrie",
                cast: ["Tom Cruise", "Hayley Atwell"],
                poster: "https://image.tmdb.org/t/p/w500/7qFzZtKc6J8kH3Y.jpg",
                backdrop: "https://image.tmdb.org/t/p/original/hNFMawyNDWZKKHU4GYCBz1krsRM.jpg",
                status: "COMING_SOON"
            },
            {
                title: "The Batman: Part II",
                description: "Batman faces new threats as Gotham descends into chaos.",
                genres: ["Action", "Crime"],
                languages: ["English"],
                duration: 175,
                releaseDate: new Date("2025-10-03"),
                rating: 8.7,
                certificate: "UA",
                director: "Matt Reeves",
                cast: ["Robert Pattinson"],
                poster: "https://image.tmdb.org/t/p/w500/4njdAkiBdC5LnFApeXSkFQ78GdT.jpg",
                backdrop: "https://image.tmdb.org/t/p/original/bQXAqRx2Fgc46uCVWgoPz5L5Dtr.jpg",
                status: "COMING_SOON"
            },
            {
                title: "Superman: Legacy",
                description: "A new chapter in Superman’s journey of hope and humanity.",
                genres: ["Action", "Fantasy"],
                languages: ["English"],
                duration: 150,
                releaseDate: new Date("2025-07-11"),
                rating: 8.2,
                certificate: "UA",
                director: "James Gunn",
                cast: ["David Corenswet"],
                poster: "https://image.tmdb.org/t/p/w500/qZJtWlF7KXz.jpg",
                backdrop: "https://image.tmdb.org/t/p/original/jZIYaISP3GBSrVOPfrp98AMa8Ng.jpg",
                status: "COMING_SOON"
            },
            {
                title: "Fantastic Four",
                description: "Marvel’s first family enters the MCU.",
                genres: ["Action", "Sci-Fi"],
                languages: ["English"],
                duration: 145,
                releaseDate: new Date("2025-11-08"),
                rating: 8.0,
                certificate: "UA",
                director: "Matt Shakman",
                cast: ["Pedro Pascal"],
                poster: "https://image.tmdb.org/t/p/w500/rmQGdYkHkFj.jpg",
                backdrop: "https://image.tmdb.org/t/p/original/5XPPB44RQ2L7jJ.jpg",
                status: "COMING_SOON"
            },
            {
                title: "Spider-Man: Beyond the Spider-Verse",
                description: "Miles Morales faces destiny across infinite universes.",
                genres: ["Animation", "Action"],
                languages: ["English"],
                duration: 140,
                releaseDate: new Date("2026-03-27"),
                rating: 9.2,
                certificate: "U",
                director: "Joaquim Dos Santos",
                cast: ["Shameik Moore"],
                poster: "https://image.tmdb.org/t/p/w500/4S2Z1k9zZs.jpg",
                backdrop: "https://image.tmdb.org/t/p/original/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg",
                status: "COMING_SOON"
            },
            {
                title: "Star Wars: New Jedi Order",
                description: "Rey builds a new Jedi Order in a fractured galaxy.",
                genres: ["Sci-Fi", "Adventure"],
                languages: ["English"],
                duration: 160,
                releaseDate: new Date("2026-12-18"),
                rating: 8.3,
                certificate: "UA",
                director: "Sharmeen Obaid-Chinoy",
                cast: ["Daisy Ridley"],
                poster: "https://image.tmdb.org/t/p/w500/xDMIl84Qo5.jpg",
                backdrop: "https://image.tmdb.org/t/p/original/6ELJEzQJ3Y45HczvreC3dg0GV5R.jpg",
                status: "COMING_SOON"
            },
            {
                title: "Gladiator II",
                description: "The legacy of Rome continues with a new warrior.",
                genres: ["Action", "Drama"],
                languages: ["English"],
                duration: 155,
                releaseDate: new Date("2025-11-22"),
                rating: 8.4,
                certificate: "A",
                director: "Ridley Scott",
                cast: ["Paul Mescal"],
                poster: "https://image.tmdb.org/t/p/w500/bKPtXn9n4.jpg",
                backdrop: "https://image.tmdb.org/t/p/original/qB6x8K.jpg",
                status: "COMING_SOON"
            }

      // ================= ALREADY RELEASED MOVIES =================

{
                title: "Oppenheimer",
                description: "The story of J. Robert Oppenheimer and the creation of the atomic bomb.",
                genres: ["Drama", "History"],
                languages: ["English"],
                duration: 180,
                releaseDate: new Date("2023-07-21"),
                rating: 8.9,
                certificate: "UA",
                director: "Christopher Nolan",
                cast: ["Cillian Murphy", "Robert Downey Jr."],
                poster: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
                backdrop: "https://image.tmdb.org/t/p/original/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg",
                status: "ENDED"
            },
            {
                title: "Barbie",
                description: "Barbie and Ken explore the real world after leaving Barbieland.",
                genres: ["Comedy", "Fantasy"],
                languages: ["English"],
                duration: 114,
                releaseDate: new Date("2023-07-21"),
                rating: 7.9,
                certificate: "U",
                director: "Greta Gerwig",
                cast: ["Margot Robbie", "Ryan Gosling"],
                poster: "https://image.tmdb.org/t/p/w500/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg",
                backdrop: "https://image.tmdb.org/t/p/original/ctMserH8g2SeOAnCw5gFjdQF8mo.jpg",
                status: "ENDED"
            },
            {
                title: "Dune: Part Two",
                description: "Paul Atreides unites with the Fremen to seek revenge.",
                genres: ["Sci-Fi", "Adventure"],
                languages: ["English"],
                duration: 166,
                releaseDate: new Date("2024-03-01"),
                rating: 8.8,
                certificate: "UA",
                director: "Denis Villeneuve",
                cast: ["Timothée Chalamet", "Zendaya"],
                poster: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
                backdrop: "https://image.tmdb.org/t/p/original/jYEW5xZkZk2WTrdbMGAPFuBqbDc.jpg",
                status: "NOW_SHOWING"
            },
            {
                title: "John Wick: Chapter 4",
                description: "John Wick takes on the High Table across the globe.",
                genres: ["Action", "Thriller"],
                languages: ["English"],
                duration: 169,
                releaseDate: new Date("2023-03-24"),
                rating: 8.5,
                certificate: "A",
                director: "Chad Stahelski",
                cast: ["Keanu Reeves"],
                poster: "https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg",
                backdrop: "https://image.tmdb.org/t/p/original/h8gHn0OzBoaefsYseUByqsmEDMY.jpg",
                status: "ENDED"
            },
            {
                title: "Spider-Man: No Way Home",
                description: "Peter Parker faces villains from across the multiverse.",
                genres: ["Action", "Adventure"],
                languages: ["English"],
                duration: 148,
                releaseDate: new Date("2021-12-17"),
                rating: 8.7,
                certificate: "UA",
                director: "Jon Watts",
                cast: ["Tom Holland", "Zendaya"],
                poster: "https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg",
                backdrop: "https://image.tmdb.org/t/p/original/14QbnygCuTO0vl7CAFmPf1fgZfV.jpg",
                status: "ENDED"
            },
            {
                title: "Top Gun: Maverick",
                description: "Pete Maverick returns to train elite pilots.",
                genres: ["Action", "Drama"],
                languages: ["English"],
                duration: 131,
                releaseDate: new Date("2022-05-27"),
                rating: 8.6,
                certificate: "UA",
                director: "Joseph Kosinski",
                cast: ["Tom Cruise"],
                poster: "https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg",
                backdrop: "https://image.tmdb.org/t/p/original/odJ4hx6g6vBt4lBWKFD1tI8WS4x.jpg",
                status: "ENDED"
            },
            {
                title: "The Dark Knight",
                description: "Batman faces the Joker in Gotham’s darkest hour.",
                genres: ["Action", "Crime"],
                languages: ["English"],
                duration: 152,
                releaseDate: new Date("2008-07-18"),
                rating: 9.0,
                certificate: "UA",
                director: "Christopher Nolan",
                cast: ["Christian Bale", "Heath Ledger"],
                poster: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
                backdrop: "https://image.tmdb.org/t/p/original/hZkgoQYus5vegHoetLkCJzb17zJ.jpg",
                status: "ENDED"
            }





        ];

        await Movie.insertMany(movies);

        res.status(201).json({
            success: true,
            message: "🔥 Real movies (2025–2026) added successfully",
            count: movies.length
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

module.exports = { seedMovies };
