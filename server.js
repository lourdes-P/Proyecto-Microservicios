const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const Movie = require('./models/Movie');
const path = require('path'); // use for static paths
const http = require('http');
const { Server } = require('socket.io'); // WebSocket library
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = 3000;

const server = http.createServer(app);
const io = new Server(server); // Inicializa WebSocket

// Middleware
app.use(bodyParser.json());
app.use(cors());  // permite solicitudes desde cualquier origen

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection setup
const mongoUri = process.env.MONGO_URI;
const connectWithRetry = () => {
  mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).then(() => {
      console.log('Connected to MongoDB');
    }).catch(err => {
      console.error('Connecting error with MongoDB:', err);
      setTimeout(connectWithRetry, 5000);
    });
}

connectWithRetry();

// Endpoints

// Redirect from localhost:3000 to localhost:3000/index
app.get('/', (req, res) => {
  res.redirect('/index');
});

// GET index/home -> http://localhost:3000/index
app.get('/index', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// GET all movies -> http://localhost:3000/movies
app.get('/movies', async (req, res) => {
  try {
    const movies = await Movie.find();
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: 'Error getting all movies' });
  }
});

// GET movie by id -> http://localhost:3000/movies/{id}
app.get('/movies/id/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    res.json(movie);
  } catch (err) {
    res.status(500).json({ error: 'Error getting movie by id' });
  }
});

// GET random movies -> http://localhost:3000/movies/random?count=${count}
app.get('/movies/random', async (req, res) => {
  try {
    // Obtener el parámetro 'count' de la URL (si no se especifica, por defecto será 1)
    const count = parseInt(req.query.count) || 1;

    // Ejecutar la consulta para obtener 'count' películas aleatorias
    const randomMovies = await Movie.aggregate([{ $sample: { size: count } }]);
    console.log(randomMovies);

    if (randomMovies.length === 0) {
      return res.status(404).json({ error: 'No movies found' });
    }

    res.json(randomMovies);
  } catch (err) {
    res.status(500).json({ error: 'Error getting random movies' });
    console.log("Error getting movies");
  }
});

// POST endpoint para recibir recomendaciones
app.post('/recommendations', (req, res) => {
  const recommendations = req.body; // Recibe las recomendaciones

  // Envía las recomendaciones a todos los clientes conectados
  io.emit('newRecommendations', recommendations);

  res.status(200).send({ message: 'Recommendations received and sent to the client.' });
});

// Startup server
server.listen(PORT, () => {
  console.log(`Debug msg: Server running in http://localhost:${PORT}`);
});