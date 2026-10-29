require('dotenv').config();

const { createExpressApp } = require('./src/http/expressApp');
const { documentClient } = require('./src/container');
const EmailService = require('./src/modules/email/application/EmailService');

const app = createExpressApp();
const PORT = process.env.PORT || 3100;
const HOST = process.env.HOST;

// Start Server only if not imported as a module (e.g for testing)
if (require.main === module) {
    const onListen = () => {
        const address = HOST || '0.0.0.0';
        console.log(`Server is running on ${address}:${PORT}`);

        const emailProvider = EmailService.describeProvider();
        if (emailProvider.configured) {
            console.log(`[EmailService] outbound email provider: ${emailProvider.provider}`);
        } else {
            console.warn(`[EmailService] WARNING: outbound email is disabled - ${emailProvider.detail}`);
        }
    };

    const server = HOST
        ? app.listen(PORT, HOST, onListen)
        : app.listen(PORT, onListen);

    // The Postgres adapter owns a connection pool. Draining it on SIGTERM keeps database
    // connections from lingering after PM2 or Docker replaces the process.
    const shutdown = (signal) => {
        console.log(`${signal} received: closing the HTTP server`);

        server.close(async () => {
            try {
                if (typeof documentClient.close === 'function') {
                    await documentClient.close();
                }
            } catch (error) {
                console.error('[shutdown] could not close the document client', error);
            }

            process.exit(0);
        });

        // PM2 sends SIGKILL after 5s; exit before the supervisor has to.
        setTimeout(() => process.exit(1), 4000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}

module.exports = app;
