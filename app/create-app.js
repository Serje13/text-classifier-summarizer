"use strict";

const { loadConfig } = require("../config");
const { createLogger } = require("../logger");
const { GroqAdapter } = require("../models/groq.adapter");
const { Classifier } = require("../modes/classifier");
const { Summarizer } = require("../modes/summarizer");
const { createProcessor } = require("../core/processor");

/**
 * Creates and initializes the application and its dependencies.
 *
 * @param {Object} [options]
 * @param {string} [options.logLevel='INFO'] - Minimum logging level.
 * @param {Function} [options.logOutput] - Custom log output function.
 * @returns {Promise<Object>} Initialized application interface.
 */
async function createApp({ logLevel = "INFO", logOutput } = {}) {
    const config = loadConfig();
    const logger = createLogger(logLevel, {
        output: logOutput,
    });

    const model = await GroqAdapter.create({
        ...config.groq,
        maxOutputTokens: config.processing.maxOutputTokens,
    });

    const classifier = new Classifier(model);
    const summarizer = new Summarizer(model);

    const processor = createProcessor({
        classifier,
        summarizer,
        logger,
        concurrency: config.processing.concurrency,
        maxInputLength: config.processing.maxInputLength,
    });

    return {
        process: processor.process,
        supportedModes: processor.supportedModes,
    };
}

module.exports = { createApp };
