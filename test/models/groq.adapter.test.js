"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { GroqAdapter } = require("../../models/groq.adapter");

function createAdapter(response, options = {}) {
    const calls = [];

    const client = {
        chat: {
            completions: {
                create: async (params) => {
                    calls.push(params);

                    if (options.error) {
                        throw options.error;
                    }

                    return response;
                },
            },
        },
    };

    const adapter = new GroqAdapter(client, {
        model: "openai/gpt-oss-120b",
        maxOutputTokens: 200,
    });

    return { adapter, calls };
}

test("sends a request with the expected Groq parameters", async () => {
    const { adapter, calls } = createAdapter({
        choices: [{ message: { content: '{"topics":["finance"]}' } }],
    });

    await adapter.generate({
        systemPrompt: "System prompt",
        userPrompt: "User prompt",
    });

    assert.deepEqual(calls[0], {
        model: "openai/gpt-oss-120b",
        messages: [
            { role: "system", content: "System prompt" },
            { role: "user", content: "User prompt" },
        ],
        temperature: 0.2,
        max_completion_tokens: 200,
        response_format: { type: "json_object" },
    });
});

test("returns response content and token usage", async () => {
    const response = {
        choices: [{ message: { content: '{"topics":["finance"]}' } }],
        usage: {
            prompt_tokens: 10,
            completion_tokens: 5,
            total_tokens: 15,
        },
    };

    const { adapter } = createAdapter(response);

    const result = await adapter.generate({
        systemPrompt: "System",
        userPrompt: "User",
    });

    assert.deepEqual(result, {
        content: '{"topics":["finance"]}',
        usage: {
            promptTokens: 10,
            completionTokens: 5,
            totalTokens: 15,
        },
    });
});

test("returns null usage when usage is missing", async () => {
    const { adapter } = createAdapter({
        choices: [{ message: { content: '{"topics":["finance"]}' } }],
    });

    const result = await adapter.generate({
        systemPrompt: "System",
        userPrompt: "User",
    });

    assert.equal(result.usage, null);
});

test("rejects response without choices", async () => {
    const { adapter } = createAdapter({});

    await assert.rejects(
        () =>
            adapter.generate({
                systemPrompt: "System",
                userPrompt: "User",
            }),
        /empty or invalid response/,
    );
});

test("rejects response with empty content", async () => {
    const responses = [
        { choices: [{ message: { content: "" } }] },
        { choices: [{ message: { content: "   " } }] },
        { choices: [{ message: { content: null } }] },
    ];

    for (const response of responses) {
        const { adapter } = createAdapter(response);

        await assert.rejects(
            () =>
                adapter.generate({
                    systemPrompt: "System",
                    userPrompt: "User",
                }),
            /empty or invalid response/,
        );
    }
});

test("propagates Groq API errors", async () => {
    const apiError = new Error("Groq API unavailable");
    const { adapter } = createAdapter({}, { error: apiError });

    await assert.rejects(
        () =>
            adapter.generate({
                systemPrompt: "System",
                userPrompt: "User",
            }),
        (error) => error === apiError,
    );
});
