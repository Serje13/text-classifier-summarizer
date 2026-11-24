"use strict";

const { LOG_LEVELS } = require("../config/logging");

/**
 * Creates a structured application logger.
 *
 * @param {string} [level='INFO'] - Minimum log level.
 * @param {Object} [options]
 * @param {Function} [options.output] - Custom log output function.
 * @returns {Object} Logger interface.
 */
function createLogger(level = "INFO", { output } = {}) {
    const normalizedLevel = level.toUpperCase();
    const minimumLevel = LOG_LEVELS[normalizedLevel];

    if (minimumLevel === undefined) {
        throw new Error(`Unsupported log level: ${level}`);
    }

    function log(logLevel, message, metadata = {}) {
        if (LOG_LEVELS[logLevel] < minimumLevel) {
            return;
        }

        const entry = {
            timestamp: new Date().toISOString(),
            level: logLevel,
            message,
            ...metadata,
        };

        const serialized = JSON.stringify(entry);

        if (output) {
            output(serialized);
            return;
        }

        if (logLevel === "ERROR") {
            console.error(serialized);
        } else if (logLevel === "WARN") {
            console.warn(serialized);
        } else {
            console.log(serialized);
        }
    }

    return Object.freeze({
        debug: (message, metadata) => log("DEBUG", message, metadata),
        info: (message, metadata) => log("INFO", message, metadata),
        warn: (message, metadata) => log("WARN", message, metadata),
        error: (message, metadata) => log("ERROR", message, metadata),
    });
}

module.exports = { createLogger };
