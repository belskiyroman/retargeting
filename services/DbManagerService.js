export default class DbManager {

    constructor (dbDriver, config={}) {
        if (!dbDriver) {
            throw new Error('Invalid arguments. ' + __filename);
        }

        this._dbDriver = dbDriver;
        this._isConnected = false;
        this._client = null;

        this._PORT = config.port || 6379;
        this._HOST = config.host || '127.0.0.1';

        this._retryTime = 0;
        this._ONE_MINUTE = 60000;
        this._ONE_SECOND = 1000;
    }

    connect () {
        const PORT = this._PORT;
        const HOST = this._HOST;
        const dbDriver = this._dbDriver;


        this._client = dbDriver.createClient(PORT, HOST);

        this._client.on('ready', () => {
            console.log(new Date().toString(), 'Redis connected on: ' + HOST + ':' + PORT);
            this._isConnected = true;
            this._retryTime = 0;
        });

        this._client.on('error', (err) => {
            const ONE_MINUTE = this._ONE_MINUTE;
            const ONE_SECOND = this._ONE_SECOND;
            const retryTime = this._retryTime;

            this._isConnected = false;
            this._client.end();
            this._retryTime = retryTime >= ONE_MINUTE ? retryTime : retryTime + ONE_SECOND;

            setTimeout(() => this.connect(), retryTime);
            console.error(new Date().toString(), 'Database connection error - ' + err.messages);
        });

        return this;
    }

    getSegmentsByUserId (userId) {
        if (!userId) {
            throw new Error(new Date().toString() + ' invalid arguments');
        }

        const promise = new Promise((resolve, reject) => {
            if (process.env.NODE_DEBUG) console.log(new Date(), 'DB log: send request to database by userId: "' + userId);
            this._client.get(userId, (err, reply) => {
                if (err) return reject(err);
                if (!reply) return resolve([]);

                const userProfile = JSON.parse(reply);
                const collectionSegments = this.getCollectionSegments(userProfile);

                if (process.env.NODE_DEBUG) console.log(new Date(), 'DB log: responce by userId "' + userId + '": ' + collectionSegments);
                resolve(collectionSegments);
            });
        });

        return promise;
    }

    getCollectionSegments (collectionSegments) {
        const isOldFormat = collectionSegments.length && typeof collectionSegments[0] === 'object';

        if (isOldFormat) {
            collectionSegments = collectionSegments.reduce((res, segments) => res.concat(segments.ids), []);
        }

        return collectionSegments;
    }

}

