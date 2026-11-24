"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const { createApp } = require("./create-app");
const { SUPPORTED_MODES } = require("../config/modes");

const USAGE = `
Usage:
  node app/run.js --input <file> --mode <classify|summarize> [--log-level <DEBUG|INFO|WARN|ERROR>]

Options:
  --input       Path to JSON file containing an array of emails.
  --mode        Processing mode: classify or summarize.
  --log-level   Logging level (default: INFO).
  --help         Show this help message.
`;

/**
 * Parses command-line arguments.
 *
 * @param {string[]} args
 * @returns {Object} Parsed options.
 */
function parseArgs(args) {
    const options = {
        input: null,
        mode: null,
        logLevel: "INFO",
    };
    const providedOptions = new Set();

    for (let index = 0; index < args.length; index++) {
        const argument = args[index];

        if (argument === "--help") {
            return { help: true };
        }

        if (!["--input", "--mode", "--log-level"].includes(argument)) {
            throw new Error(`Unknown argument: ${argument}`);
        }

        const value = args[index + 1];

        if (!value || value.startsWith("--")) {
            throw new Error(`Missing value for ${argument}.`);
        }

        const optionName = {
            "--input": "input",
            "--mode": "mode",
            "--log-level": "logLevel",
        }[argument];

        if (providedOptions.has(optionName)) {
            throw new Error(
                `Argument ${argument} was provided more than once.`,
            );
        }

        providedOptions.add(optionName);

        options[optionName] = value;
        index++;
    }

    if (!options.input) {
        throw new Error("The --input argument is required.");
    }

    if (!options.mode) {
        throw new Error("The --mode argument is required.");
    }

    return options;
}

/**
 * Runs the application from the command line.
 *
 * @param {string[]} args
 */
async function main(args) {
    const options = parseArgs(args);

    if (options.help) {
        process.stdout.write(USAGE.trim() + "\n");
        return;
    }

    if (!SUPPORTED_MODES.includes(options.mode)) {
        throw new Error(
            `Unsupported mode: ${options.mode}. Supported modes: ${SUPPORTED_MODES.join(", ")}.`,
        );
    }

    const inputPath = path.resolve(options.input);

    let inputContent;

    try {
        inputContent = await fs.readFile(inputPath, "utf8");
    } catch {
        throw new Error(`Unable to read input file: ${options.input}`);
    }

    let emails;

    try {
        emails = JSON.parse(inputContent);
    } catch {
        throw new Error("Input file contains invalid JSON.");
    }

    if (!Array.isArray(emails)) {
        throw new Error("Input JSON must contain an array of emails.");
    }

    const app = await createApp({
        logLevel: options.logLevel,
        logOutput: (message) => process.stderr.write(`${message}\n`),
    });

    const results = await app.process(emails, options.mode);

    process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
}

main(process.argv.slice(2)).catch((error) => {
    process.stderr.write(`Error: ${error.message}\n`);
    process.exitCode = 1;
});
