const express = require('express');
const fs = require('fs').promises; 
const app = express();
const port = 3001;


function Movie(data) {
  this.title = data.title;
  this.poster_path = data.poster_path;
  this.overview = data.overview;
}


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

app.get('/favorite',(req,res)=>{
    res.send('Welcome to Favorite Pag');
})

function errorHandler(err, req, res, next) {
    console.error(err.stack); 
    res.status(500).send('Internal Server Error'); 
  }
  function notFoundHandler(req, res, next) {
    res.status(404).send('Page Not Found');
  }
  app.use(errorHandler);
  app.use(notFoundHandler)
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
