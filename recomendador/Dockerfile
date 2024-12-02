FROM python:3.9-slim

EXPOSE 3002

WORKDIR /app

COPY . /app

RUN pip install pandas numpy Counter scikit-learn amqp pika httpx fastapi uvicorn

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3002"]