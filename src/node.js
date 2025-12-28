const WebSocket = require("ws");

require("dotenv").config();
const HA_WEBHOOK = process.env.HA_WEBHOOK;

if (!HA_WEBHOOK) {
    console.error("HA_WEBHOOK environment variable is not set");
    process.exit(1);
}

function connect() {
    const ws = new WebSocket("wss://www.seismicportal.eu/standing_order/websocket");

    ws.on("open", () => {
        console.log("Connected to SeismicPortal");
    });

    ws.on("message", async (msg) => {
        const event = JSON.parse(msg);
        console.debug("Inbound event:", event);
        
        const payload = event.data;
        
        console.debug(`Sending event to Home Assistant webhook: ${HA_WEBHOOK}`);
        fetch(HA_WEBHOOK, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        }).then((res) => {
            console.debug(`WebHook responded with status: ${res.status}`);
        }).catch((err) => {
            console.error("Error sending event to WebHook:", err);
        });
    });

    ws.on("error", console.error);

    ws.on("close", () => {
        console.log("Disconnected – reconnecting...");
        setTimeout(connect, 5000);
    });
}

connect();