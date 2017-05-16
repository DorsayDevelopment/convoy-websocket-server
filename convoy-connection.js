const debug = require('debug');
const logger = debug('convoy:connection');

const LOCATION_EXCHANGE = 'location';

class ConvoyConnection {
  constructor(socket, rabbitmqChannel) {
    this._socket = socket;
    this._rabbitmq = rabbitmqChannel;
    this._queueName = null;

    this._setupConsumer()
      .then((queueName) => {
        this._queueName = queueName;
        rabbitmqChannel.publishEvent(22, { type: 'connect' });
        socket.on('message', this._onReceive.bind(this));
        socket.on('close', this._onClose.bind(this));
        socket.on('error', this._onError.bind(this));
      }).catch((err) => {
        console.error(err);
        socket.close();
      });
  }

  send(data) {
    this._socket.send(data);
  }

  _onReceive(message) {
    logger('Incoming data', message);

    try {
      const data = JSON.parse(message);
      console.log(data);
    } catch (err) {
      console.error(err);
    }
  }

  _onClose() {
    logger('Connection closed');

    if (this._queueName !== null) {
      this._rabbitmq.cancel(this._queueName);
      this._rabbitmq.deleteQueue(this._queueName);
    }

    this._queueName = null;
  }

  _onError() {
    console.error('ERROR!!!!');
  }

  _rabbitConsumer(message) {
    // Check if socket is still open
    if (this._socket.readyState === 1) {
      const data = message.content.toString('utf8');
      console.log(data);
      this.send(data);
    }
  }

  async _setupConsumer() {
    const queueOptions = {
      exclusive: true,
      durable: false
    };
    const consumerOptions = {
      noAck: true,
    };

    const results = await this._rabbitmq.assertQueue(null, queueOptions);
    logger('Created new queue:', results.queue);

    await this._rabbitmq.bindQueue(results.queue, LOCATION_EXCHANGE, '#');
    this._rabbitmq.consume(results.queue, this._rabbitConsumer.bind(this), consumerOptions);

    return results.queue;
  }
}

module.exports = ConvoyConnection;