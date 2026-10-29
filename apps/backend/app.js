require('dotenv').config();

const { createExpressApp } = require('./src/http/expressApp');
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

    if (HOST) {
        app.listen(PORT, HOST, onListen);
    } else {
        app.listen(PORT, onListen);
    }
}

module.exports = app;
