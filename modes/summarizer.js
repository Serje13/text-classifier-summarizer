"use strict";

const { parseJsonResponse } = require("../core/parse-json-response");
const { buildSummarizerPrompt } = require("../prompts/summarizer");

const sentenceSegmenter = new Intl.Segmenter(undefined, {
    granularity: "sentence",
});

function countSentences(text) {
    return Array.from(sentenceSegmenter.segment(text)).filter(
        ({ segment }) => segment.trim().length > 0,
    ).length;
}

/**
 * Generates concise summaries of text.
 */
class Summarizer {
    /**
     * @param {TextModel} model - Text generation model.
     */
    constructor(model) {
        this.model = model;
    }

    /**
     * Summarizes the provided text into one or two sentences.
     *
     * @param {string} text - Text to summarize.
     * @returns {Promise<{
     *   summary: string,
     *   usage: {
     *     promptTokens: number,
     *     completionTokens: number,
     *     totalTokens: number
     *   } | null
     * }>} Summary and optional token usage.
     * @throws {Error} If model generation fails or the response contains invalid JSON or summary content.
     */
    async execute(text) {
        const prompt = buildSummarizerPrompt(text);
        const result = await this.model.generate(prompt);

        const parsed = parseJsonResponse(result.content);

        if (
            typeof parsed.summary !== "string" ||
            parsed.summary.trim().length === 0
        ) {
            throw new Error("AI model returned an invalid summary.");
        }

        const summary = parsed.summary.trim();
        const sentenceCount = countSentences(summary);

        if (sentenceCount < 1 || sentenceCount > 2) {
            throw new Error(
                "AI model returned a summary that does not contain 1–2 sentences.",
            );
        }

        return {
            summary,
            usage: result.usage,
        };
    }
}

module.exports = { Summarizer };
