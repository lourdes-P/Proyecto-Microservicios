var amqp = require('amqplib/callback_api');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = 3001;
const cors = require('cors');
app.use(cors());  // permite solicitudes desde cualquier origen

let movieHistory = [];
const queue_historial = 'historial';

// Middleware para manejar JSON en las solicitudes
app.use(bodyParser.json());

let channel;

amqp.connect('amqp://rabbitmq', function(error0, connection) {
    if (error0) {
        throw error0;
    }

    channel = connection.createChannel(function(error1, channel) {
        if (error1) {
            throw error1;
        }

        channel.assertQueue(queue_historial, {
            durable: false
        });

        console.log("Esperando películas ", queue_historial);
    });
});


// Ruta para guardar el historial
app.post('/save', (req, res) => {
    const {id, title, poster, plot} = req.body;
    const movieData = {id, title, poster, plot};

    movieHistory.push(movieData);

    channel.sendToQueue(queue_historial, Buffer.from(JSON.stringify(movieData)));

    console.log('Película guardada en el historial:', movieData);
    
    res.status(200).json({ message: 'Película guardada correctamente' });
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Microservicio de historial corriendo en http://localhost:${port}`);
});

// debug
function getHistory(req, res) {
  return res.json(movieHistory);
}

module.exports = { getHistory };
