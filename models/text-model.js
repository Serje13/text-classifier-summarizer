"use strict";

/**
 * Provider-independent interface for text generation.
 *
 * Implementations must accept system and user prompts and return
 * generated content together with optional token usage information.
 *
 * @abstract
 */
class TextModel {
    /**
     * Generates text using the configured model provider.
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
     * @throws {Error} If the method is not implemented.
     */
    async generate(_options) {
        throw new Error("TextModel.generate() must be implemented.");
    }
}

module.exports = { TextModel };
