"use strict";

function parseJsonResponse(content) {
    let parsed;

    try {
        parsed = JSON.parse(content);
    } catch {
        throw new Error("AI model returned invalid JSON.");
    }

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("AI model returned an unexpected JSON structure.");
    }

    return parsed;
}

module.exports = { parseJsonResponse };
