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
    
    static closeCodeDescriptions = {
        1000: "Normal Closure",
        1001: "Going Away (server/client leaving)",
        1002: "Protocol Error",
        1003: "Unsupported Data",
        1005: "No Status Received",
        1006: "Abnormal Closure (no close frame)",
        1007: "Invalid Frame Payload Data",
        1008: "Policy Violation",
        1009: "Message Too Big",
        1010: "Mandatory Extension Missing",
        1011: "Internal Server Error",
        1012: "Service Restart",
        1013: "Try Again Later",
        1014: "Bad Gateway",
        1015: "TLS Handshake Failure"
    };

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
            logger.verbose("Inbound event:" + msg);

            const event = JSON.parse(msg);
            const action = event.action;

            // Check if we should process this action type
            if (!this.shouldProcess(action)) {
                logger.verbose(`Skipping action "${action}" (filtered out)`);
                return;
            }

            const payload = JSON.stringify(event);

            logger.http(`Sending ${action} event to Home Assistant webhook`);
            fetch(this.webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: payload,
            })
			.then((res) => {
				logger.http(`WebHook responded with status: ${res.status}`);
			})
			.catch((err) => {
				logger.error("Error sending event to WebHook:", {
					message: err.message,
					code: err.code,
					cause: err.cause,
				});
				logger.debug("Full error object:", err);
			});
        });

        this.ws.on("error", (err) => {
            logger.error("WebSocket error:", {
				message: err.message,
				code: err.code,
				cause: err.cause,
			});
			logger.debug("Full error object:", err);
        });

        this.ws.on("close", (code, reason) => {
            const description = SeismicNotifier.closeCodeDescriptions[code] || `Unknown code (${code})`;
            logger.warn("WebSocket disconnected", {
                code: code,
                reason: reason.toString() || "No reason provided",
                message: description
            });
            logger.info("Reconnecting in 5 seconds...");
            setTimeout(() => this.connect(), 5000);
        });
    }
}

module.exports = SeismicNotifier;
