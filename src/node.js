require("dotenv").config();

const WebSocket = require("ws");
const logger = require("./logger");

const HA_WEBHOOK = process.env.HA_WEBHOOK;

if (!HA_WEBHOOK) {
    logger.error("HA_WEBHOOK environment variable is not set");
    process.exit(1);
}

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