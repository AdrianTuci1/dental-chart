require('dotenv').config();

const { createExpressApp } = require('./src/http/expressApp');
const { startServer } = require('./src/http/startServer');

const app = createExpressApp();

// Tests import the app; only a direct run opens a socket and installs signal handlers.
if (require.main === module) {
    startServer(app);
}

module.exports = app;
