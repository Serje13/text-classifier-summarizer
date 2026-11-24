"use strict";

const { parseJsonResponse } = require("../core/parse-json-response");
const { buildClassifierPrompt } = require("../prompts/classifier");
const { ALLOWED_TOPICS } = require("../config/topics");

const allowedTopics = new Set(ALLOWED_TOPICS);

/**
 * Classifies text into one or more predefined topics.
 */
class Classifier {
    /**
     * @param {TextModel} model - Text generation model.
     */
    constructor(model) {
        this.model = model;
    }

    /**
     * Classifies the provided text.
     *
     * @param {string} text - Text to classify.
     * @returns {Promise<{
     *   topics: string[],
     *   usage: {
     *     promptTokens: number,
     *     completionTokens: number,
     *     totalTokens: number
     *   } | null
     * }>} Classification topics and optional token usage.
     * @throws {Error} If model generation fails or the response contains invalid JSON or topics.
     */
    async execute(text) {
        const prompt = buildClassifierPrompt(text);
        const result = await this.model.generate(prompt);

        const parsed = parseJsonResponse(result.content);

        if (
            !Array.isArray(parsed.topics) ||
            parsed.topics.length === 0 ||
            !parsed.topics.every(
                (topic) =>
                    typeof topic === "string" && allowedTopics.has(topic),
            )
        ) {
            throw new Error("AI model returned invalid classification topics.");
        }

        return {
            topics: [...new Set(parsed.topics)],
            usage: result.usage,
        };
    }
}

module.exports = { Classifier };
