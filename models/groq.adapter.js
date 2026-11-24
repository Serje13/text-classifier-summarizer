"use strict";

const { TextModel } = require("./text-model");

/**
 * Groq implementation of the text generation interface.
 */
class GroqAdapter extends TextModel {
    /**
     * Creates a Groq adapter instance.
     *
     * @param {Object} client - Initialized Groq SDK client.
     * @param {Object} options - Adapter configuration.
     * @param {string} options.model - Groq model identifier.
     * @param {number} [options.maxOutputTokens=300] - Maximum output tokens.
     */
    constructor(client, { model, maxOutputTokens = 300 }) {
        super();

        this.client = client;
        this.model = model;
        this.maxOutputTokens = maxOutputTokens;
    }

    /**
     * Creates an adapter using the Groq SDK.
     *
     * @param {Object} config - Application configuration.
     * @param {string} config.apiKey - Groq API key.
     * @param {string} config.model - Groq model identifier.
     * @param {number} config.maxOutputTokens - Maximum output tokens.
     * @returns {Promise<GroqAdapter>} Initialized Groq adapter.
     * @throws {Error} If the SDK cannot be loaded or the client cannot be initialized.
     */
    static async create(config) {
        const { default: Groq } = await import("groq-sdk");

        const client = new Groq({
            apiKey: config.apiKey,
        });

        return new GroqAdapter(client, {
            model: config.model,
            maxOutputTokens: config.maxOutputTokens,
        });
    }

    /**
     * Generates a JSON-formatted response through the Groq API.
     *
     * @param {Object} options - Generation options.
     * @param {string} options.systemPrompt - System instruction for the model.
     * @param {string} options.userPrompt - User input for the model.
     * @returns {Promise<{
     *   content: string,
     *   usage: {
     *     promptTokens: number,
     *     completionTokens: number,
     *     totalTokens: number
     *   } | null
     * }>} Generated content and optional token usage.
     * @throws {Error} If the API request fails or the response content is empty or invalid.
     */
    async generate({ systemPrompt, userPrompt }) {
        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            temperature: 0.2,
            max_completion_tokens: this.maxOutputTokens,
            response_format: { type: "json_object" },
        });

        const content = response?.choices?.[0]?.message?.content;

        if (typeof content !== "string" || !content.trim()) {
            throw new Error("Groq returned an empty or invalid response.");
        }

        return {
            content,
            usage: response.usage
                ? {
                      promptTokens: response.usage.prompt_tokens,
                      completionTokens: response.usage.completion_tokens,
                      totalTokens: response.usage.total_tokens,
                  }
                : null,
        };
    }
}

module.exports = { GroqAdapter };
