const WebSocket = require('ws');
const amqplib = require('amqplib');
const ConvoyConnection = require('./convoy-connection');
const debug = require('debug');
const logger = debug('convoy');

const { RABBITMQ_HOST, RABBITMQ_PORT } = process.env;

const RABBITMQ_URL = `amqp://${RABBITMQ_HOST}:${RABBITMQ_PORT}`;
const EXCHANGE = {
  EVENT: 'event',
  LOCATION: 'location'
};

function publishEvent(channel, user, data) {
  channel.publish(EXCHANGE.EVENT, `${user}.event`, new Buffer(JSON.stringify(data)));
}

async function setupRabbit(connectionString) {
  const exchangeOptions = {
    durable: true
  }
  
  const client = await amqplib.connect(connectionString);
  const channel = await client.createChannel();

  await channel.assertExchange(EXCHANGE.EVENT, 'topic', exchangeOptions);
  channel.publishEvent = publishEvent.bind(null, channel);

  return channel;
}

function getChannel(connectionString, maxTries=0) {
  let tries = 0;

  return new Promise((resolve, reject) => {
    const retry = setInterval(() => {
      console.log(`Attemping rabbitmq connection try ${++tries} of ${maxTries || 'infinite'}...`);

      setupRabbit(connectionString)
        .then((channel) => {
          clearInterval(retry);
          resolve(channel);
        })
        .catch((err) => {
          if (maxTries > 0 && tries >= maxTries) {
            console.log('Maximum tries reached. Aborting...')
            clearInterval(retry);
            reject(err);
          }
        });
    }, 2000);
  });
}

async function getChannel(connectionString) {
}

async function main() {
  const channel = await getChannel(RABBITMQ_URL);

  const wss = new WebSocket.Server({ 
    port: 8000,
    host: '0.0.0.0'
  });

  wss.on('connection', function connection(socket) {
    logger('Incoming connection');
    const connection = new ConvoyConnection(socket, channel);
  });

  wss.on('listening', function listening() {
    logger('Server listening...');
  });

  logger('Websocket server started');
}

main();
