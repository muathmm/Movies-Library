const express = require('express');
const fs = require('fs').promises;
const axios = require('axios');
const dotenv = require('dotenv').config();  
const app = express();
const port = 3001;
const apiKey = process.env.API_KEY; 

function Movie(data) {
  this.title = data.title;
  this.poster_path = data.poster_path;
  this.overview = data.overview;
}

app.get('/trending', trendingHandler);

app.get('/search', async (req, res) => {
  const query = req.query.query;
  try {
    const response = await axios.get(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${query}`);
    const searchData = response.data.results.map(movie => ({
      id: movie.id,
      release_date: movie.release_date,
      title: movie.title,
      poster_path: movie.poster_path,
      overview: movie.overview
    }));
    res.json(searchData);
  } catch (error) {
    console.error('Error searching for movies:', error);
    res.status(500).json({ error: error.message });
  }
});

//http://localhost:3001/movie/123
app.get('/movie/:id', async (req, res) => {
  const movieId = req.params.id;
  try {
    const response = await axios.get(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}`);
    const movieDetails = response.data;
    res.json(movieDetails);
  } catch (error) {
    console.error('Error fetching movie details:', error);
    res.status(500).json({ error: error.message });
  }
});


app.get('/popular', async (req, res) => {
  try {
    const response = await axios.get(`https://api.themoviedb.org/3/movie/popular?api_key=${apiKey}`);
    const popularMovies = response.data.results.map(movie => ({
      id: movie.id,
      release_date: movie.release_date,
      title: movie.title,
      poster_path: movie.poster_path,
      overview: movie.overview
    }));
    res.json(popularMovies);
  } catch (error) {
    console.error('Error fetching popular movies:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/', async (req, res) => {
  try {
    const rawData = await fs.readFile('moviesData/movies.json');
    const moviesData = JSON.parse(rawData);
    const movie = new Movie(moviesData);
    res.json(movie);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/favorite', (req, res) => {
  res.send('Welcome to Favorite Page');  // Corrected the spelling of 'Page'
});

function trendingHandler(req, res) {
  axios.get(`https://api.themoviedb.org/3/trending/movie/week?api_key=${apiKey}`)
    .then(response => {
      const trendingMovies = response.data.results.map(movie => ({
        id: movie.id,
        release_date: movie.release_date,
        title: movie.title,
        poster_path: movie.poster_path,
        overview: movie.overview
      }));
      res.json(trendingMovies);
    })
    .catch(error => {
      console.error('Error fetching trending movies:', error);
      res.status(500).json({ error: error.message });
    });
}

function errorHandler(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Internal Server Error');
}

function notFoundHandler(req, res, next) {
  res.status(404).send('Page Not Found');
}

app.use(errorHandler);
app.use(notFoundHandler);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
