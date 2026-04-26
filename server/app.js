const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3001;

const path = require('path');

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "data:", "https://cdn.jsdelivr.net"],
            connectSrc: ["'self'", "https://cdn.jsdelivr.net"],
        },
    },
}));
app.use(cors({
    origin: 'https://app.pixtooth.com', // În producție, înlocuiește cu URL-ul frontend-ului
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
const apiRoutes = require('./src/routes/api');
app.use('/api', apiRoutes);

const docsDir = path.join(__dirname, 'docs');

app.get('/docs', (req, res) => {
    res.sendFile(path.join(docsDir, 'index.html'));
});

app.get('/docs/', (req, res) => {
    res.sendFile(path.join(docsDir, 'index.html'));
});

app.get('/docs/openapi.yaml', (req, res) => {
    res.type('application/yaml');
    res.sendFile(path.join(docsDir, 'openapi.yaml'));
});

// Health Check Route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Dental Chart Server is running' });
});

// Start Server only if not imported as a module (e.g for testing)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

module.exports = app;
