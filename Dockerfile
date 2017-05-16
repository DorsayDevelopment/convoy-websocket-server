FROM node:7-alpine

WORKDIR /app

COPY package.json .
RUN npm install --silent
COPY . .

ENV RABBITMQ_HOST localhost
ENV RABBITMQ_PORT 5672

EXPOSE 8000
CMD ["node", "/app/index.js"]