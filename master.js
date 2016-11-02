var cluster = require('cluster');

var config = {
    numWorkers: process.env.SCALE || require('os').cpus().length,
};

cluster.setupMaster({
    exec: process.env.WORKER || 'index.js'
});

// Fork workers as needed.
for (var i = 0; i < config.numWorkers; i++) {
    cluster.fork();
}

console.log('list of pids workers:');

Object.keys(cluster.workers).forEach(function(id) {
    console.log(cluster.workers[id].process.pid);
});