const WebSocket = require("ws");
const logger = require("./logger");

// Bitwise-like flags for notification types
const NotificationTypes = {
    NONE: 0,
    CREATE: 1 << 0,  // 1
    UPDATE: 1 << 1,  // 2
    DELETE: 1 << 2,  // 4
    OTHER: 1 << 3,   // 8 - for unknown/future action types
    ALL: (1 << 0) | (1 << 1) | (1 << 2) | (1 << 3)  // 15
};

class SeismicNotifier {
    static validTypes = ['create', 'update', 'delete', 'other', 'all'];

    constructor(webhookUrl, initialFilters = null) {
        this.webhookUrl = webhookUrl;
        this.filter = NotificationTypes.ALL; // Default: all notifications
        this.ws = null;
        
        // Set initial filters if provided
        if (initialFilters) {
            this.setFilter(initialFilters);
        }
    }

    // Set filter from array of strings (e.g., ["create", "update"])
    setFilter(types) {
        if (types.includes("all")) {
            this.filter = NotificationTypes.ALL;
            logger.info("Notification filter set to: ALL");
            return;
        }

        this.filter = NotificationTypes.NONE;
        types.forEach(type => {
            const upperType = type.toUpperCase();
            if (NotificationTypes[upperType] !== undefined) {
                this.filter |= NotificationTypes[upperType];
            }
        });

        const activeFilters = [];
        if (this.filter & NotificationTypes.CREATE) activeFilters.push("create");
        if (this.filter & NotificationTypes.UPDATE) activeFilters.push("update");
        if (this.filter & NotificationTypes.DELETE) activeFilters.push("delete");
        if (this.filter & NotificationTypes.OTHER) activeFilters.push("other");
        
        logger.info(`Notification filter set to: ${activeFilters.join(", ") || "NONE"}`);
    }

    // Check if action should be processed based on current filter
    shouldProcess(action) {
        // If filter is set to ALL, accept everything
        if (this.filter === NotificationTypes.ALL) {
            return true;
        }
        
        const upperAction = action.toUpperCase();
        
        // Check if it's a known action type
        if (NotificationTypes[upperAction]) {
            return (this.filter & NotificationTypes[upperAction]) !== 0;
        }
        
        // Unknown action type - check if OTHER flag is set
        return (this.filter & NotificationTypes.OTHER) !== 0;
    }

    // Get current filter as array of strings
    getActiveFilters() {
        if (this.filter === NotificationTypes.ALL) {
            return ["all"];
        }
        
        const filters = [];
        if (this.filter & NotificationTypes.CREATE) filters.push("create");
        if (this.filter & NotificationTypes.UPDATE) filters.push("update");
        if (this.filter & NotificationTypes.DELETE) filters.push("delete");
        if (this.filter & NotificationTypes.OTHER) filters.push("other");
        return filters.length > 0 ? filters : ["none"];
    }

    connect() {
        this.ws = new WebSocket("wss://www.seismicportal.eu/standing_order/websocket");

        this.ws.on("open", () => {
            logger.info("Connected to SeismicPortal");
        });

        this.ws.on("message", async (msg) => {
            logger.debug("Inbound event:" + msg);
            
            const event = JSON.parse(msg);
            const action = event.action;
            
            // Check if we should process this action type
            if (!this.shouldProcess(action)) {
                logger.debug(`Skipping action "${action}" (filtered out)`);
                return;
            }

            const payload = event.data;
            
            logger.info(`Sending ${action} event to Home Assistant webhook`);
            fetch(this.webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            }).then((res) => {
                logger.debug(`WebHook responded with status: ${res.status}`);
            }).catch((err) => {
                logger.error("Error sending event to WebHook:" + JSON.stringify(err));
            });
        });

        this.ws.on("error", (err) => {
            logger.error("WebSocket error:" + JSON.stringify(err));
        });

        this.ws.on("close", () => {
            logger.info("Disconnected – reconnecting...");
            setTimeout(() => this.connect(), 5000);
        });
    }
}

module.exports = SeismicNotifier;
