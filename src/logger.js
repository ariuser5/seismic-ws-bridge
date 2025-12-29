const { createLogger, format, transports } = require("winston");

const validLevels = [
    "error",
    "warn",
    "info",
    "http",
    "verbose",
    "debug",
    "silly",
];

const logger = createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: format.combine(
        format.timestamp(),
        format.printf(({ timestamp, level, message, ...meta }) => {
            let msg = `[${timestamp}] ${level}: ${message}`;
            // If there's additional metadata, append it
            if (Object.keys(meta).length > 0) {
                msg += " " + JSON.stringify(meta);
            }
            return msg;
        })
    ),
    transports: [new transports.Console()],
});

// Expose method to change log level at runtime
logger.setLevel = (level) => {
    logger.level = level;
    logger.info(`Log level changed to: ${level}`);
};

logger.validLevels = validLevels;

module.exports = logger;
