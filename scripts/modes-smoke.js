const { loadConfig } = require("../config");
const { GroqAdapter } = require("../models/groq.adapter");
const { Classifier } = require("../modes/classifier");
const { Summarizer } = require("../modes/summarizer");

async function main() {
    const config = loadConfig();

    const model = await GroqAdapter.create({
        ...config.groq,
        maxOutputTokens: config.processing.maxOutputTokens,
    });

    const classifier = new Classifier(model);
    const summarizer = new Summarizer(model);

    const email = [
        "Subject: Invoice payment overdue",
        "Dear customer,",
        "Your invoice #1234 is overdue.",
        "Please complete the payment within 5 business days.",
    ].join("\n");

    console.log("Testing classification...");

    const classification = await classifier.execute(email);
    console.log(JSON.stringify(classification, null, 2));

    console.log("\nTesting summarization...");

    const summary = await summarizer.execute(email);
    console.log(JSON.stringify(summary, null, 2));

    console.log("\nBoth modes tested successfully.");
}

main().catch((error) => {
    console.error("Mode test failed:", error.message);
    process.exitCode = 1;
});
