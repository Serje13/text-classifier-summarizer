"use strict";

const { createApp } = require("./create-app");
const { SUPPORTED_MODES } = require("../config/modes");

let appPromise;

/**
 * Returns the initialized application.
 *
 * The application instance is reused across Lambda invocations
 * within the same execution environment.
 *
 * @returns {Promise<Object>} Application interface.
 */
function getApp() {
    if (!appPromise) {
        appPromise = createApp({
            logLevel: process.env.LOG_LEVEL || "INFO",
        });
    }

    return appPromise;
}

/**
 * AWS Lambda entry point.
 *
 * @param {Object} event - Lambda invocation event.
 * @returns {Promise<Array<Object>>} Processing results.
 */
async function handler(event) {
    if (!event || typeof event !== "object" || Array.isArray(event)) {
        throw new TypeError("Lambda event must be an object.");
    }

    const { mode, emails } = event;

    if (!SUPPORTED_MODES.includes(mode)) {
        throw new Error(
            `Unsupported processing mode: ${mode}. Supported modes: ${SUPPORTED_MODES.join(", ")}.`,
        );
    }

    if (!Array.isArray(emails)) {
        throw new TypeError("Event must contain an emails array.");
    }

    const app = await getApp();
    return app.process(emails, mode);
}

module.exports = { handler };
