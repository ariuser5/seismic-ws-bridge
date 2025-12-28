require("dotenv").config();

const http = require("http");
const logger = require("./logger");
const SeismicNotifier = require("./notifier");

const HA_WEBHOOK = process.env.HA_WEBHOOK;
const ADMIN_PORT = process.env.ADMIN_PORT || 3000;
const NOTIFICATION_FILTERS = process.env.NOTIFICATION_FILTERS;

if (!HA_WEBHOOK) {
    logger.error("HA_WEBHOOK environment variable is not set");
    process.exit(1);
}

// Parse initial notification filters from environment variable
let initialFilters = null;
if (NOTIFICATION_FILTERS) {
    try {
        // Support comma-separated list: "create,update" or JSON array
        if (NOTIFICATION_FILTERS.startsWith('[')) {
            initialFilters = JSON.parse(NOTIFICATION_FILTERS);
        } else {
            initialFilters = NOTIFICATION_FILTERS.split(',').map(f => f.trim());
        }
        logger.info(`Initial notification filters from env: ${initialFilters.join(', ')}`);
    } catch (err) {
        logger.warn(`Failed to parse NOTIFICATION_FILTERS: ${err.message}. Using default (all).`);
    }
}

// Initialize the seismic notifier
const notifier = new SeismicNotifier(HA_WEBHOOK, initialFilters);

// HTTP server for runtime management (health check, log level, and filter changes)
const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'ok', 
            logLevel: logger.level,
            activeFilters: notifier.getActiveFilters()
        }));
    } else if (req.method === 'POST' && req.url === '/log-level') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const { level } = JSON.parse(body);
                const validLevels = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'];
                if (!validLevels.includes(level)) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid log level', validLevels }));
                    return;
                }
                logger.setLevel(level);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, newLevel: level }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
    } else if (req.method === 'POST' && req.url === '/filter') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const { types } = JSON.parse(body);
                if (!Array.isArray(types)) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        error: 'types must be an array', 
                        example: { types: ["create", "update"] }
                    }));
                    return;
                }
                
                const invalidTypes = types.filter(t => !SeismicNotifier.validTypes.includes(t.toLowerCase()));
                
                if (invalidTypes.length > 0) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        error: 'Invalid notification types', 
                        invalidTypes,
                        validTypes: SeismicNotifier.validTypes 
                    }));
                    return;
                }
                
                notifier.setFilter(types);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: true, 
                    activeFilters: notifier.getActiveFilters() 
                }));
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

server.listen(ADMIN_PORT, () => {
    logger.info(`Admin server running on port ${ADMIN_PORT}`);
    logger.info(`Health check: http://localhost:${ADMIN_PORT}/health`);
    logger.info(`Change log level: POST to http://localhost:${ADMIN_PORT}/log-level with {"level":"debug"}`);
    logger.info(`Change notification filter: POST to http://localhost:${ADMIN_PORT}/filter with {"types":["create","update"]}`);
});

// Start the notifier
notifier.connect();