"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");

const createAppPath = require.resolve("../../app/create-app");
const handlerPath = require.resolve("../../app/handler");

test("Lambda handler validates events and returns an array", async () => {
    let createAppCalls = 0;
    let processCalls = 0;
    let receivedMode;
    let receivedEmails;

    const expectedResults = [
        { id: 1, topics: ["finance"] },
        { id: 2, topics: ["technical"] },
    ];

    const mockModule = new Module(createAppPath, module);
    mockModule.filename = createAppPath;
    mockModule.loaded = true;
    mockModule.exports = {
        createApp: async () => {
            createAppCalls++;

            return {
                process: async (emails, mode) => {
                    processCalls++;
                    receivedEmails = emails;
                    receivedMode = mode;

                    return expectedResults;
                },
            };
        },
    };

    const previousCreateApp = require.cache[createAppPath];
    const previousHandler = require.cache[handlerPath];

    require.cache[createAppPath] = mockModule;
    delete require.cache[handlerPath];

    try {
        const { handler } = require("../../app/handler");

        await assert.rejects(handler(null), TypeError);

        await assert.rejects(handler([]), TypeError);

        await assert.rejects(handler("invalid"), TypeError);

        await assert.rejects(
            handler({ mode: "invalid", emails: [] }),
            /Unsupported processing mode/,
        );

        await assert.rejects(
            handler({ mode: "classify", emails: "invalid" }),
            /emails array/,
        );

        // Invalid events must not initialize the application.
        assert.equal(createAppCalls, 0);
        assert.equal(processCalls, 0);

        const emails = [
            { id: 1, subject: "Invoice", body: "Payment received." },
            { id: 2, subject: "Server", body: "Server is unavailable." },
        ];

        const result = await handler({
            mode: "classify",
            emails,
        });

        assert.deepEqual(result, expectedResults);
        assert.ok(Array.isArray(result));
        assert.equal(receivedMode, "classify");
        assert.equal(receivedEmails, emails);

        // Application is initialized only once.
        assert.equal(createAppCalls, 1);
        assert.equal(processCalls, 1);

        // Subsequent invocations reuse the initialized application.
        await handler({
            mode: "summarize",
            emails,
        });

        assert.equal(createAppCalls, 1);
        assert.equal(processCalls, 2);
    } finally {
        delete require.cache[handlerPath];

        if (previousHandler) {
            require.cache[handlerPath] = previousHandler;
        }

        if (previousCreateApp) {
            require.cache[createAppPath] = previousCreateApp;
        } else {
            delete require.cache[createAppPath];
        }
    }
});
