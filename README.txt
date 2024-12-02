Author: Lourdes Panzone

Project consists of:
    - 3 microservices:
        . one in Express, the history of clicked movies.
        . one in Python, the recommender.
        . API between mongo and app (server.js), also in express.
    - Containerized mongo that imports movies.json on build.
    - Containerized RabbitMQ.
    - index.html, where frontend is.

---------------------------------------------------------------
---------------------------PYTHON------------------------------
---------------------------------------------------------------
Folder ./recomendador contains a python script. Its Dockerfile
installs all necessary dependencies.
Installations take a while (~30 seconds) when building with docker.

IMPORTANT :: RECOMMENDER
Microservice is supposed to make a 3 movie recommendation from one single movie input.
Carousel can contain up to 12 recommendations (3x4).
Sometimes recommender matrix or connection acts sloppy. Try refreshing the page or 
clicking on another movie if this happens.
CORS policy sometimes blocks fetching of poster image on the recommendation carousel.
This means placeholder image will take its place due to error.

---------------------------------------------------------------
---------------------KEYS FOR OMDb-----------------------------
---------------------------------------------------------------

1. d0ef971e
2. ece82a6e
3. 69d6f01e

IMPORTANT :: MOVIE POSTERS:
If URL exists in database, that URL will be used to retrieve the image poster. 
If it does not exist, IMDB will be queried for the URL (id will be formatted for query).
If IMDB does not contain such id, a placeholder image will replace the poster.
Consider that if the URL is in the database and the image has been removed from the site,
poster will not be shown.
It has been implemented this way so that delay is reduced while waiting for the posters,
and so that there are less posters that show the placeholder 
(database has less posters than IMDb).

---------------------------------------------------------------
------------------------API ACCESS-----------------------------
---------------------------------------------------------------

1. To access the API endpoints:
    1.0. GET http://localhost:3000 (index.html)
    1.1. GET http://localhost:3000/movies (all movies)
    1.2. GET http://localhost:3000/movies/id/{id} (movie with id <id>)
    1.3. GET http://localhost:3000/movies/random (random movie)

---------------------------------------------------------------
-------------------------RabbitMQ------------------------------
---------------------------------------------------------------
Since rabbitmq might take a while before completely being up and running,
history microservice will restart themselves on failure 
(if connection cannot be made).
Docker-compose file in section historial will contain:
    restart: on-failure
More than one restart might be needed.
