"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const { validateEmail } = require("../../core/validate-email");

test("validates and combines subject and body", () => {
    const result = validateEmail({
        subject: "  Invoice #1234  ",
        body: "  Payment is overdue.  ",
    });

    assert.deepEqual(result, {
        text: "Invoice #1234\n\nPayment is overdue.",
    });
});

test("accepts an email with only a subject", () => {
    const result = validateEmail({
        subject: "Important announcement",
        body: " ",
    });

    assert.deepEqual(result, {
        text: "Important announcement",
    });
});

test("accepts an email with only a body", () => {
    const result = validateEmail({
        subject: "",
        body: "Message content",
    });

    assert.deepEqual(result, {
        text: "Message content",
    });
});

test("rejects an empty email", () => {
    const result = validateEmail({
        subject: " ",
        body: "",
    });

    assert.deepEqual(result, {
        error: "empty_input",
    });
});

test("rejects invalid email values", () => {
    for (const email of [null, undefined, "text", 123, []]) {
        assert.deepEqual(validateEmail(email), { error: "invalid_email" });
    }
});

test("rejects non-string subject or body", () => {
    assert.deepEqual(validateEmail({ subject: 123, body: "Text" }), {
        error: "invalid_email",
    });
});

test("rejects emails exceeding the maximum length", () => {
    const result = validateEmail({ subject: "12345", body: "" }, 4);

    assert.deepEqual(result, {
        error: "input_too_long",
    });
});

test("accepts emails at the maximum allowed length", () => {
    const result = validateEmail({ subject: "1234", body: "" }, 4);

    assert.deepEqual(result, {
        text: "1234",
    });
});
