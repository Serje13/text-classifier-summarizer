"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { loadConfig } = require("../../config");

test("loads default configuration values", () => {
    const originalEnv = { ...process.env };

    try {
        process.env.GROQ_API_KEY = "test-api-key";
        delete process.env.MAX_INPUT_LENGTH;
        delete process.env.MAX_OUTPUT_TOKENS;
        delete process.env.PROCESSING_CONCURRENCY;

        const config = loadConfig();

        assert.equal(config.groq.apiKey, "test-api-key");
        assert.equal(config.groq.model, "openai/gpt-oss-120b");
        assert.equal(config.processing.maxInputLength, 10000);
        assert.equal(config.processing.maxOutputTokens, 300);
        assert.equal(config.processing.concurrency, 3);
    } finally {
        process.env = originalEnv;
    }
});

test("loads custom positive integer configuration values", () => {
    const originalEnv = { ...process.env };

    try {
        process.env.GROQ_API_KEY = "test-api-key";
        process.env.MAX_INPUT_LENGTH = "5000";
        process.env.MAX_OUTPUT_TOKENS = "200";
        process.env.PROCESSING_CONCURRENCY = "5";

        const config = loadConfig();

        assert.equal(config.processing.maxInputLength, 5000);
        assert.equal(config.processing.maxOutputTokens, 200);
        assert.equal(config.processing.concurrency, 5);
    } finally {
        process.env = originalEnv;
    }
});

test("rejects invalid integer configuration values", () => {
    const originalEnv = { ...process.env };

    try {
        process.env.GROQ_API_KEY = "test-api-key";

        const invalidValues = ["invalid", "0", "-1", "1.5", "9007199254740992"];

        const variables = [
            "MAX_INPUT_LENGTH",
            "MAX_OUTPUT_TOKENS",
            "PROCESSING_CONCURRENCY",
        ];

        for (const variable of variables) {
            for (const value of invalidValues) {
                process.env.MAX_INPUT_LENGTH = "10000";
                process.env.MAX_OUTPUT_TOKENS = "300";
                process.env.PROCESSING_CONCURRENCY = "3";

                process.env[variable] = value;

                assert.throws(
                    () => loadConfig(),
                    new RegExp(`${variable} must be a positive integer`),
                    `${variable} should reject ${value}`,
                );
            }
        }
    } finally {
        process.env = originalEnv;
    }
});

test("rejects missing API key", () => {
    const originalEnv = { ...process.env };

    try {
        delete process.env.GROQ_API_KEY;

        assert.throws(() => loadConfig(), /GROQ_API_KEY is not configured/);
    } finally {
        process.env = originalEnv;
    }
});

test("rejects empty or whitespace-only API key", () => {
    const originalEnv = { ...process.env };

    try {
        for (const value of ["", "   "]) {
            process.env.GROQ_API_KEY = value;

            assert.throws(() => loadConfig(), /GROQ_API_KEY is not configured/);
        }
    } finally {
        process.env = originalEnv;
    }
});
