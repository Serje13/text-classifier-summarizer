"use strict";

const SUMMARIZER_SYSTEM_PROMPT = [
    "You are a concise email summarization assistant.",
    "Summarize the email in one or two sentences.",
    "Preserve the main message and important details.",
    "Do not add information that is not present in the email.",
    'Return a JSON object with this structure: {"summary":"..."}.',
    "Do not include explanations.",
].join(" ");

function buildSummarizerPrompt(text) {
    return {
        systemPrompt: SUMMARIZER_SYSTEM_PROMPT,
        userPrompt: `Summarize the following email:\n\n${text}`,
    };
}

module.exports = {
    buildSummarizerPrompt,
};
