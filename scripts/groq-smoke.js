const { loadConfig } = require("../config");
const { GroqAdapter } = require("../models/groq.adapter");

async function main() {
    const config = loadConfig();

    const model = await GroqAdapter.create({
        ...config.groq,
        maxOutputTokens: config.processing.maxOutputTokens,
    });

    console.log(`Testing adapter with model: ${config.groq.model}`);

    const result = await model.generate({
        systemPrompt: [
            "You are a text classification assistant.",
            "Return only a valid JSON object.",
            'Use this exact structure: {"topics":["technical"]}.',
        ].join(" "),
        userPrompt:
            "Classify this email: The engineering team will deploy a new API version tomorrow.",
    });

    const parsed = JSON.parse(result.content);

    if (!Array.isArray(parsed.topics)) {
        throw new Error("Unexpected response structure.");
    }

    console.log("\nParsed response:");
    console.log(JSON.stringify(parsed, null, 2));

    console.log("\nToken usage:");
    console.log(result.usage);

    console.log("\nGroqAdapter test successful.");
}

main().catch((error) => {
    console.error("GroqAdapter test failed:", error.message);
    process.exitCode = 1;
});
