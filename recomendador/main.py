import pandas as pd
import numpy as np
from collections import Counter
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
from sklearn.metrics.pairwise import linear_kernel, cosine_similarity
import amqp
import pika
import json
from fastapi import FastAPI
import httpx
import warnings
warnings.filterwarnings('ignore')

app = FastAPI()

CONSUMER_QUEUE_NAME = 'historial'
JSON_FILE = 'movies.json'
PORT = '3002'
queue_has_been_declared=False

# Primero acomodo el dataframe y después el while true
movies = pd.read_json(JSON_FILE, lines=True)

# directors transformation
movies['directors_clean'] = movies['directors'].apply(
    lambda x: ', '.join([str(i).lower().replace(" ", "") for i in x]) if isinstance(x, list) else ''
)

# transformacion de cast
movies['cast_clean'] = movies['cast'].apply(
    lambda x: ', '.join([str(i).lower().replace(" ", "") for i in x]) if isinstance(x, list) else ''
)

# string :: title, directors, cast, genre
movies['soup'] = movies.apply(lambda x: ' '.join([str(x['title']), str(x['directors_clean'] or ''), str(x['cast_clean'] or ''), str(x['genres'] or '')]), axis=1)
count = CountVectorizer(analyzer='word',ngram_range=(1, 2),min_df=0.0, stop_words='english')
count_matrix = count.fit_transform(movies['soup'])

# calculo la similitud del coseno de la matriz count_matrix consigo misma
cosine_sim = cosine_similarity(count_matrix, count_matrix)

indices = pd.Series(movies.index, index=movies['title'])
titles = movies['title']

# calculo 3 recomendaciones a partir de una película (el carrusel tiene 3 por pagina)
def get_recommendations(title, n=3, self_exclude = True):
    try:
        # Se intenta obtener el índice del título dado
        idx = indices[title]
    except KeyError:
        # Si el título no existe, se procede a encontrar el índice de la pelicula más similar
        sim_scores = list(enumerate(cosine_sim))
        idx = max(sim_scores, key=lambda x: max(x[1]))[0]

    # Se buscan las puntuaciones de similitud para la pelicula
    sim_scores = list(enumerate(cosine_sim[idx]))
    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
    if self_exclude :
      sim_scores = sim_scores[1:n+1]
    else :
      sim_scores = sim_scores[0:n+1]
    movies_indices = [i[0] for i in sim_scores]

    # Se crea un DataFrame que integre las peliculas recomendadas
    recommended_movies = movies.iloc[movies_indices].copy()

    # tambien se puede hacer con return json.dumps(recommended_movies.to_dict(orient='records'))
    
    return recommended_movies.to_json(orient='records',index=False,lines=False)

def callbackHistory(ch, method, properties, body) : 
    print("callback")
    data = json.loads(body)
    title = data.get('title', '') 
    print(f'Recibiendo título: {title}')
    recommendations = get_recommendations(title)
    # para prueba local usar la url comentada
    #url = 'http://localhost:3000/recommendations'
    url = 'http://app:3000/recommendations'
    headers = {'Content-Type': 'application/json'}
    response = httpx.post(url, data=recommendations, headers=headers)
    print(recommendations)
    print(response)
    # Imprimir la respuesta para depuración


def consumer(queue_has_been_declared) :
    print("consumidor")
    connection = pika.BlockingConnection(pika.URLParameters('amqp://guest:guest@rabbitmq:5672/%2F'))
    #conexión local (no usar con la app dockerizada):
    #connection = pika.BlockingConnection(pika.ConnectionParameters(host='localhost', port=5672))
    channel = connection.channel()
    print("Conexión hecha exitosamente") 
    if not(queue_has_been_declared):      
        channel.queue_declare(queue=CONSUMER_QUEUE_NAME, durable=False)
        queue_has_been_declared=True
    print(f"Suscribiéndome a la cola: {CONSUMER_QUEUE_NAME}")
    channel.basic_consume(queue=CONSUMER_QUEUE_NAME, on_message_callback=callbackHistory, auto_ack=True)
    channel.start_consuming()


while(True):
    try:
        consumer(queue_has_been_declared)  # connection closes after some time so to reconnect it's in a loop
    except Exception as e:
        print(f"Error inesperado: {e}. Reintentando...")
        continue




