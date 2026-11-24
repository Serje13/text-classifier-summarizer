"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const CLI_PATH = path.join(PROJECT_ROOT, "app", "run.js");

/**
 * Executes the CLI in a separate Node.js process.
 *
 * @param {string[]} args
 * @returns {import('node:child_process').SpawnSyncReturns<string>}
 */
function runCli(args) {
    return spawnSync(process.execPath, [CLI_PATH, ...args], {
        cwd: PROJECT_ROOT,
        encoding: "utf8",
    });
}

test("shows help without initializing the application", () => {
    const result = runCli(["--help"]);

    assert.equal(result.status, 0);
    assert.match(result.stdout, /Usage:/);
});

test("rejects missing required arguments", () => {
    const result = runCli(["--input", "sample/emails.json"]);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /--mode argument is required/);
});

test("reports missing input files", () => {
    const result = runCli([
        "--input",
        "sample/non-existent.json",
        "--mode",
        "classify",
    ]);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /Unable to read input file/);
});

test("rejects invalid JSON input", () => {
    const tempDirectory = fs.mkdtempSync(
        path.join(os.tmpdir(), "classifier-cli-"),
    );

    const inputPath = path.join(tempDirectory, "invalid.json");

    try {
        fs.writeFileSync(inputPath, "{ invalid json }", "utf8");

        const result = runCli(["--input", inputPath, "--mode", "classify"]);

        assert.equal(result.status, 1);
        assert.match(result.stderr, /Input file contains invalid JSON/);
    } finally {
        fs.rmSync(tempDirectory, {
            recursive: true,
            force: true,
        });
    }
});

test("rejects JSON input that is not an array", () => {
    const tempDirectory = fs.mkdtempSync(
        path.join(os.tmpdir(), "classifier-cli-"),
    );

    const inputPath = path.join(tempDirectory, "invalid.json");

    try {
        fs.writeFileSync(inputPath, '{"id": 1}', "utf8");

        const result = runCli(["--input", inputPath, "--mode", "classify"]);

        assert.equal(result.status, 1);
        assert.match(
            result.stderr,
            /Input JSON must contain an array of emails/,
        );
    } finally {
        fs.rmSync(tempDirectory, {
            recursive: true,
            force: true,
        });
    }
});

test("rejects duplicate command-line arguments", () => {
    const result = runCli([
        "--input",
        "sample/emails.json",
        "--mode",
        "classify",
        "--mode",
        "summarize",
    ]);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /Argument --mode was provided more than once/);
});

test("rejects unsupported modes before reading the input file", () => {
    const result = runCli([
        "--input",
        "sample/non-existent.json",
        "--mode",
        "unknown",
    ]);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /Unsupported mode: unknown/);
    assert.doesNotMatch(result.stderr, /Unable to read input file/);
});
