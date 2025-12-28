require("dotenv").config();

const WebSocket = require("ws");
const http = require("http");
const logger = require("./logger");

const HA_WEBHOOK = process.env.HA_WEBHOOK;
const ADMIN_PORT = process.env.ADMIN_PORT || 3000;

if (!HA_WEBHOOK) {
    logger.error("HA_WEBHOOK environment variable is not set");
    process.exit(1);
}

// HTTP server for runtime management (health check and log level changes)
const server = http.createServer((req, res) => {
    if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', logLevel: logger.level }));
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
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

server.listen(ADMIN_PORT, () => {
    logger.info(`Admin server running on port ${ADMIN_PORT}`);
    logger.info(`Health check: http://localhost:${ADMIN_PORT}/health`);
    logger.info(`Change log level: POST to http://localhost:${ADMIN_PORT}/log-level with {"level":"debug"}`);
});

function connect() {
    const ws = new WebSocket("wss://www.seismicportal.eu/standing_order/websocket");

    ws.on("open", () => {
        logger.info("Connected to SeismicPortal");
    });

    ws.on("message", async (msg) => {
        logger.debug("Inbound event:" + msg);
        
        const event = JSON.parse(msg);
        const payload = event.data;
        
        logger.debug(`Sending event to Home Assistant webhook: ${HA_WEBHOOK}`);
        fetch(HA_WEBHOOK, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        }).then((res) => {
            logger.debug(`WebHook responded with status: ${res.status}`);
        }).catch((err) => {
            logger.error("Error sending event to WebHook:" + JSON.stringify(err));
        });
    });

    ws.on("error", (err) => {
        logger.error("WebSocket error:" + JSON.stringify(err));
    });
    ws.on("close", () => {
        logger.info("Disconnected – reconnecting...");
        setTimeout(connect, 5000);
    });
}

connect();