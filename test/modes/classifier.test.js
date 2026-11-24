"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { Classifier } = require("../../modes/classifier");
const { ALLOWED_TOPICS } = require("../../config/topics");

function createClassifier(response) {
    const model = {
        generate: async () => ({
            content: JSON.stringify(response),
            usage: {
                promptTokens: 10,
                completionTokens: 5,
                totalTokens: 15,
            },
        }),
    };

    return new Classifier(model);
}

test("returns valid classification topics", async () => {
    const classifier = createClassifier({
        topics: ["finance", "technical"],
    });

    const result = await classifier.execute("Payment system is unavailable.");

    assert.deepEqual(result.topics, ["finance", "technical"]);
});

test("removes duplicate topics", async () => {
    const classifier = createClassifier({
        topics: ["finance", "finance", "technical"],
    });

    const result = await classifier.execute("Payment system issue.");

    assert.deepEqual(result.topics, ["finance", "technical"]);
});

test("rejects an empty topics array", async () => {
    const classifier = createClassifier({
        topics: [],
    });

    await assert.rejects(
        () => classifier.execute("Some email text."),
        /invalid classification topics/,
    );
});

test("rejects unknown topics", async () => {
    const classifier = createClassifier({
        topics: ["unknown"],
    });

    await assert.rejects(
        () => classifier.execute("Some email text."),
        /invalid classification topics/,
    );
});

test("rejects non-string topics", async () => {
    const classifier = createClassifier({
        topics: ["finance", 123],
    });

    await assert.rejects(
        () => classifier.execute("Some email text."),
        /invalid classification topics/,
    );
});

test("rejects a missing topics field", async () => {
    const classifier = createClassifier({});

    await assert.rejects(
        () => classifier.execute("Some email text."),
        /invalid classification topics/,
    );
});

test("returns token usage separately from classification topics", async () => {
    const classifier = createClassifier({
        topics: ["finance"],
    });

    const result = await classifier.execute("Payment received.");

    assert.deepEqual(result, {
        topics: ["finance"],
        usage: {
            promptTokens: 10,
            completionTokens: 5,
            totalTokens: 15,
        },
    });
});

test("accepts every configured allowed topic", async () => {
    const classifier = createClassifier({
        topics: ALLOWED_TOPICS,
    });

    const result = await classifier.execute("General email text.");

    assert.deepEqual(result.topics, ALLOWED_TOPICS);
});
