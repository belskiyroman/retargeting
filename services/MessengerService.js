const events = require('events');

class MessengerService extends events.EventEmitter {

    constructor (kafka, opt) {

        super();

        if (!kafka || !opt) {
            throw new Error('Invalid arguments. ' + __filename);
        }

        var _consumer = null; // write when called this.consumer()

        const clientId = opt.clientId + process.pid || 'worker ' + process.pid;
        const connectionString = opt.connectionString;
        const payloads =[{
            topic: opt.topic
        }];
        const options = {
            groupId: opt.groupId,
            autoCommit: opt.autoCommit,
            autoCommitIntervalMs: opt.autoCommitInterval,
            fromOffset: opt.fromOffset
        };

        Object.defineProperty(this, '_clientId', {
            enumerable: false,
            get: () => opt.clientId + process.pid || 'worker ' + process.pid
        });

        Object.defineProperty(this, 'client', {
            enumerable: false,
            get: () => new kafka.Client(connectionString, clientId)
        });

        Object.defineProperty(this, 'consumer', {
            enumerable: false,
            get: () => {
                this._consumerClose();
                return (client) => {
                    _consumer = new kafka.HighLevelConsumer(client, payloads, options);
                    return _consumer;
                };
            }
        });

        Object.defineProperty(this, '_consumerClose', {
            enumerable: false,
            get: () => () => {
                let res = _consumer && _consumer.close();
                _consumer = null;
                return res;
            }
        });

    }

    connect () {
        const clientId = this._clientId;
        const client = this.client;
        const consumer = this.consumer(client);

        client.on('ready', () => console.log(new Date() + ' MessengerService connect ready. Client id: ' + clientId));

        if (process.env.NODE_DEBUG) {
            consumer
                .on(
                    'error',
                    (err) => console.log(new Date(), 'Messenger log: ', err)
                )
                .on(
                    'message',
                    (message) => console.log(new Date(), 'Messenger log: message:', message.value)
                );
        }

        consumer
            .on('error', () => null)
            .once('error', () => this.retry())
            .on('message', (message) => {
                let msg = null;

                try {
                    msg = JSON.parse(message.value);
                } catch (e) {
                    return;
                }

                this.emit('message', msg);
            });

        return this;
    }

    retry () {
        this._consumerClose();
        setTimeout(() => this.connect(), 2000);
        console.log(new Date() + ' MessengerService retry connect.');
    }



}

module.exports = MessengerService;