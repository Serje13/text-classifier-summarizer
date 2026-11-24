"use strict";

/**
 * Validates an email object and combines its subject and body.
 *
 * @param {object} email - Email object containing subject and body.
 * @param {number} [maxLength=10000] - Maximum allowed text length.
 * @returns {{ text: string } | { error: string }} Validation result.
 */
function validateEmail(email, maxLength = 10000) {
    if (!email || typeof email !== "object" || Array.isArray(email)) {
        return { error: "invalid_email" };
    }

    const { subject, body } = email;

    if (typeof subject !== "string" || typeof body !== "string") {
        return { error: "invalid_email" };
    }

    const text = [subject.trim(), body.trim()].filter(Boolean).join("\n\n");

    if (!text) {
        return { error: "empty_input" };
    }

    if (text.length > maxLength) {
        return { error: "input_too_long" };
    }

    return { text };
}

module.exports = { validateEmail };
