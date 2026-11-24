"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { createProcessor } = require("../../core/processor");

function createLogger() {
    return {
        entries: [],
        info(message, metadata) {
            this.entries.push({ level: "info", message, metadata });
        },
        warn(message, metadata) {
            this.entries.push({ level: "warn", message, metadata });
        },
        error(message, metadata) {
            this.entries.push({ level: "error", message, metadata });
        },
    };
}

test("processes emails and preserves their original order", async () => {
    const classifier = {
        async execute(text) {
            await new Promise((resolve) =>
                setTimeout(resolve, text === "First" ? 30 : 5),
            );

            return { topics: ["technical"], usage: null };
        },
    };

    const processor = createProcessor({
        classifier,
        summarizer: {},
    });

    const results = await processor.process(
        [
            { id: 1, subject: "First", body: "" },
            { id: 2, subject: "Second", body: "" },
        ],
        "classify",
    );

    assert.deepEqual(results, [
        { id: 1, topics: ["technical"] },
        { id: 2, topics: ["technical"] },
    ]);
});

test("continues processing after an individual email fails", async () => {
    const classifier = {
        async execute(text) {
            if (text === "Fail") {
                throw new Error("Simulated API failure");
            }

            return { topics: ["finance"], usage: null };
        },
    };

    const logger = createLogger();

    const processor = createProcessor({
        classifier,
        summarizer: {},
        logger,
    });

    const results = await processor.process(
        [
            { id: 1, subject: "Fail", body: "" },
            { id: 2, subject: "Success", body: "" },
        ],
        "classify",
    );

    assert.equal(results[0].error, "processing_failed");
    assert.deepEqual(results[1].topics, ["finance"]);
    assert.ok(logger.entries.some((entry) => entry.level === "error"));
});

test("returns validation errors without calling the model", async () => {
    let calls = 0;

    const classifier = {
        async execute() {
            calls += 1;
            return { topics: ["finance"], usage: null };
        },
    };

    const processor = createProcessor({
        classifier,
        summarizer: {},
    });

    const results = await processor.process(
        [
            { id: 1, subject: "", body: "   " },
            { id: 2, subject: "Valid", body: "" },
        ],
        "classify",
    );

    assert.equal(results[0].error, "empty_input");
    assert.equal(calls, 1);
});

test("limits the number of concurrent model requests", async () => {
    let active = 0;
    let maxActive = 0;

    const classifier = {
        async execute() {
            active += 1;
            maxActive = Math.max(maxActive, active);

            await new Promise((resolve) => setTimeout(resolve, 10));

            active -= 1;

            return { topics: ["technical"], usage: null };
        },
    };

    const processor = createProcessor({
        classifier,
        summarizer: {},
        concurrency: 2,
    });

    await processor.process(
        Array.from({ length: 5 }, (_, index) => ({
            id: index + 1,
            subject: `Email ${index + 1}`,
            body: "",
        })),
        "classify",
    );

    assert.equal(maxActive, 2);
});

test("collects token usage without exposing it in public results", async () => {
    const logger = createLogger();

    const classifier = {
        async execute() {
            return {
                topics: ["finance"],
                usage: {
                    promptTokens: 100,
                    completionTokens: 20,
                    totalTokens: 120,
                },
            };
        },
    };

    const processor = createProcessor({
        classifier,
        summarizer: {},
        logger,
    });

    const results = await processor.process(
        [{ id: 1, subject: "Invoice", body: "Payment overdue" }],
        "classify",
    );

    assert.deepEqual(results, [{ id: 1, topics: ["finance"] }]);

    const batchLog = logger.entries.find(
        (entry) => entry.message === "Batch processing completed",
    );

    assert.deepEqual(batchLog.metadata.usage, {
        promptTokens: 100,
        completionTokens: 20,
        totalTokens: 120,
    });
});

test("rejects unsupported processing modes", async () => {
    const processor = createProcessor({
        classifier: {},
        summarizer: {},
    });

    await assert.rejects(
        processor.process([], "translate"),
        /Unsupported processing mode/,
    );
});

test("returns an empty array without calling the model for empty input", async () => {
    let calls = 0;

    const classifier = {
        async execute() {
            calls += 1;
            return { topics: ["finance"], usage: null };
        },
    };

    const processor = createProcessor({
        classifier,
        summarizer: {},
    });

    const results = await processor.process([], "classify");

    assert.deepEqual(results, []);
    assert.equal(calls, 0);
});

test("rejects invalid concurrency configuration", () => {
    assert.throws(
        () =>
            createProcessor({
                classifier: {},
                summarizer: {},
                concurrency: 0,
            }),
        /Concurrency must be a positive integer/,
    );
});
