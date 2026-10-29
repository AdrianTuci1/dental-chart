const { documentClient } = require('../container');
const EmailService = require('../modules/email/application/EmailService');

// PM2 sends SIGKILL after 5s; exit before the supervisor has to.
const SHUTDOWN_TIMEOUT_MS = 4000;

const logEmailProvider = () => {
    const emailProvider = EmailService.describeProvider();

    if (emailProvider.configured) {
        console.log(`[EmailService] outbound email provider: ${emailProvider.provider}`);
        return;
    }

    console.warn(`[EmailService] WARNING: outbound email is disabled - ${emailProvider.detail}`);
};

/**
 * Process concerns for the Node hosts: bind the port, report the email provider and
 * drain the document client on termination. The HTTP app is built by expressApp.js, so
 * tests can import app.js without opening a socket or installing signal handlers.
 */
const startServer = (app, {
    port = process.env.PORT || 3100,
    host = process.env.HOST,
    client = documentClient,
    exit = process.exit,
} = {}) => {
    const onListen = () => {
        const address = host || '0.0.0.0';
        console.log(`Server is running on ${address}:${port}`);
        logEmailProvider();
    };

    const server = host
        ? app.listen(port, host, onListen)
        : app.listen(port, onListen);

    let shuttingDown = false;

    const shutdown = (signal) => {
        if (shuttingDown) {
            return;
        }

        shuttingDown = true;
        console.log(`${signal} received: closing the HTTP server`);

        server.close(async () => {
            try {
                if (typeof client.close === 'function') {
                    await client.close();
                }
            } catch (error) {
                console.error('[shutdown] could not close the document client', error);
            }

            exit(0);
        });

        setTimeout(() => exit(1), SHUTDOWN_TIMEOUT_MS).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    return server;
};

module.exports = { startServer, SHUTDOWN_TIMEOUT_MS };
