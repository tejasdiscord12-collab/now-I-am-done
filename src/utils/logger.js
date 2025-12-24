const colors = require('colors');

const logger = {
    success: (msg) => console.log(`[SUCCESS]`.green + ` ${msg}`),
    error: (msg, err) => console.log(`[ERROR]`.red + ` ${msg}`, err || ''),
    warn: (msg) => console.log(`[WARN]`.yellow + ` ${msg}`),
    info: (msg) => console.log(`[INFO]`.cyan + ` ${msg}`),
    db: (msg) => console.log(`[DATABASE]`.magenta + ` ${msg}`),
};

module.exports = logger;
