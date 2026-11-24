"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { Summarizer } = require("../../modes/summarizer");

function createModel(summary) {
    return {
        generate: async () => ({
            content: JSON.stringify({ summary }),
            usage: {
                promptTokens: 10,
                completionTokens: 20,
                totalTokens: 30,
            },
        }),
    };
}

test("accepts a one-sentence summary", async () => {
    const summarizer = new Summarizer(
        createModel("The payment was received successfully."),
    );

    const result = await summarizer.execute("Payment received.");

    assert.equal(result.summary, "The payment was received successfully.");
    assert.equal(result.usage.totalTokens, 30);
});

test("accepts a two-sentence summary", async () => {
    const summary =
        "The payment was received successfully. The invoice is now closed.";

    const summarizer = new Summarizer(createModel(summary));

    const result = await summarizer.execute("Payment received.");

    assert.equal(result.summary, summary);
});

test("rejects a summary containing more than two sentences", async () => {
    const summarizer = new Summarizer(
        createModel("Payment was received. The invoice is closed. Thank you."),
    );

    await assert.rejects(
        summarizer.execute("Payment received."),
        /1–2 sentences/,
    );
});

test("rejects an empty summary", async () => {
    const summarizer = new Summarizer(createModel("   "));

    await assert.rejects(
        summarizer.execute("Payment received."),
        /invalid summary/,
    );
});
