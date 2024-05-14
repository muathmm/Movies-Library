const express = require('express');
const fs = require('fs').promises;
const axios = require('axios');
const dotenv = require('dotenv').config();  
const app = express();
const pg=require('pg');
const port = 3001;
const apiKey = process.env.API_KEY; 
const cors=require('cors');

const client=new pg.Client('postgressql://localhost:5432/moviesdb');

app.use(express.json());
app.use(cors());

function Movie(data) {
  this.title = data.title;
  this.poster_path = data.poster_path;
  this.overview = data.overview;
}

app.get('/movie',getMovies)
app.post('/movie',addmovie)
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
  res.send('Welcome to Favorite Page'); 
});

app.put('/movie/:id',hundleUpdateMovie)
app.delete ('/movie/:id',handleDeleteMovie);
app.get('/movies/:id',handleSpesificMovie)

function handleSpesificMovie(req,res){
  let id=req.params.id;
  const sql=`SELECT * FROM movie where id=${id}`
  client.query(sql).then((result)=>{
    res.status(200).json(result.rows);
  }).catch((err)=>{
    errorHandler(err)
  })
}

function handleDeleteMovie(req,res){
  let id=req.params.id;
  const sql=`DELETE FROM movie where id=${id}` ;
  client.query(sql).then((result)=>{
    res.send('the data is deleted ');
  }).catch((err)=>{
     errorHandler(err);
  })
}

function hundleUpdateMovie(req,res){
  let id=req.params.id;
  const { title, release_date, poster_path, overview } = req.body;
  const sql=`UPDATE movie SET title = $1, release_date = $2, poster_path = $3, overview = $4 WHERE id = ${id} RETURNING *;`
  let values=[title,release_date,poster_path,overview];
  client.query(sql,values).then((result)=>{
    res.status(200).send('the data is updated')
  }).catch((err)=>{
    errorHandler(err);
  })
}

 
 function getMovies(req,res){
  const sql='SELECT * from movie '
  client.query(sql).then((data)=>{
    res.send(data.rows)
  }).catch((err)=>{
    errorHandler(err,req,res);
  })
 }

 function addmovie(req, res) {
  const movie = req.body;
  console.log (movie);
  const sql = 'INSERT INTO movie (title, release_date, poster_path, overview) VALUES ($1, $2, $3, $4) RETURNING *';
  const values = [movie.title, movie.release_date, movie.poster_path, movie.overview];
  client.query(sql, values)
      .then((data) => {
          res.send('your data was added');
      })
      .catch((err) => {
          errorHandler(err, req, res);
      });
}

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
client.connect().then(()=>{
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
})