"use strict";

require("dotenv").config({ quiet: true });

/**
 * Reads a positive integer from an environment variable.
 *
 * @param {string} name - Environment variable name.
 * @param {number} defaultValue - Value used when the variable is not set.
 * @returns {number} Validated positive integer.
 * @throws {Error} If the configured value is not a positive integer.
 */
function readPositiveInteger(name, defaultValue) {
    const value = process.env[name];

    if (value === undefined || value.trim() === "") {
        return defaultValue;
    }

    const parsed = Number(value);

    if (!Number.isSafeInteger(parsed) || parsed <= 0) {
        throw new Error(`${name} must be a positive integer.`);
    }

    return parsed;
}

/**
 * Loads application configuration from environment variables.
 *
 * @returns {Object} Application configuration.
 * @throws {Error} If required or invalid configuration is found.
 */
function loadConfig() {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey || !apiKey.trim()) {
        throw new Error("GROQ_API_KEY is not configured.");
    }

    return Object.freeze({
        groq: {
            apiKey,
            model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
        },
        processing: {
            maxInputLength: readPositiveInteger("MAX_INPUT_LENGTH", 10000),
            maxOutputTokens: readPositiveInteger("MAX_OUTPUT_TOKENS", 300),
            concurrency: readPositiveInteger("PROCESSING_CONCURRENCY", 3),
        },
    });
}

module.exports = { loadConfig };
