"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { parseJsonResponse } = require("../../core/parse-json-response");

test("parses a valid JSON object", () => {
    const result = parseJsonResponse('{"topics":["finance"]}');

    assert.deepEqual(result, { topics: ["finance"] });
});

test("rejects malformed JSON", () => {
    assert.throws(() => parseJsonResponse('{"topics":'), {
        message: "AI model returned invalid JSON.",
    });
});

test("rejects null", () => {
    assert.throws(() => parseJsonResponse("null"), {
        message: "AI model returned an unexpected JSON structure.",
    });
});

test("rejects arrays", () => {
    assert.throws(() => parseJsonResponse('["finance"]'), {
        message: "AI model returned an unexpected JSON structure.",
    });
});

test("rejects JSON primitive values", () => {
    for (const value of ['"text"', "123", "true", "false"]) {
        assert.throws(() => parseJsonResponse(value), {
            message: "AI model returned an unexpected JSON structure.",
        });
    }
});
