const express = require('express');
const router = express.Router();
const axios = require('axios');

router.get('/search', async (req, res) => {
  try {
    const { title } = req.query;
    const TMDB_KEY = process.env.TMDB_API_KEY;

    if (!TMDB_KEY) {
      return res.status(500).json({ 
        success: false, 
        message: 'TMDB API key not set in .env' 
      });
    }

    if (!title) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title is required' 
      });
    }

    const response = await axios.get(
      `https://api.themoviedb.org/3/search/movie`, {
        params: {
          api_key: TMDB_KEY,
          query: title,
          language: 'en-US',
          page: 1,
        }
      }
    );

    if (!response.data.results?.length) {
      return res.json({ success: false, message: 'No results found on TMDB' });
    }

    const movie = response.data.results[0];

    if (!movie.poster_path) {
      return res.json({ success: false, message: 'No poster found for this movie' });
    }

    res.json({
      success: true,
      poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
      backdrop: movie.backdrop_path 
        ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
        : null,
      tmdbTitle: movie.title, // so user can verify correct movie found
    });

  } catch (error) {
    console.error('TMDB Error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      message: error.response?.data?.status_message || error.message 
    });
  }
});

module.exports = router;