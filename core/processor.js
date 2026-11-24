"use strict";

const { validateEmail } = require("./validate-email");
const { SUPPORTED_MODES } = require("../config/modes");

/**
 * Creates an email processor using the supplied processing modes.
 *
 * The processor validates each email, processes valid emails with bounded
 * concurrency, and isolates failures so one email does not stop the batch.
 *
 * @param {Object} options - Processor configuration.
 * @param {Object} options.classifier - Classifier instance.
 * @param {Object} options.summarizer - Summarizer instance.
 * @param {Object} [options.logger] - Logger instance.
 * @param {number} [options.concurrency=3] - Maximum concurrent AI requests.
 * @param {number} [options.maxInputLength=10000] - Maximum allowed email text length.
 * @returns {{ process: Function, supportedModes: string[] }} Configured processor.
 * @throws {RangeError} If concurrency or maxInputLength is not a positive integer.
 */
function createProcessor({
    classifier,
    summarizer,
    logger = {},
    concurrency = 3,
    maxInputLength = 10000,
}) {
    if (!Number.isInteger(concurrency) || concurrency < 1) {
        throw new RangeError("Concurrency must be a positive integer.");
    }

    if (!Number.isInteger(maxInputLength) || maxInputLength < 1) {
        throw new RangeError(
            "Maximum input length must be a positive integer.",
        );
    }

    const modes = {
        classify: classifier,
        summarize: summarizer,
    };

    const supportedModes = SUPPORTED_MODES;

    /**
     * Processes emails independently using the selected mode.
     *
     * Results preserve the original input order. Invalid emails and processing
     * failures produce per-item errors without stopping the remaining batch.
     * Processing failures are not automatically retried.
     *
     * Token usage is aggregated and included in the completion log, but is
     * excluded from the returned results.
     *
     * An empty email array returns an empty array.
     *
     * @param {Object[]} emails - Emails to process.
     * @param {string} mode - Supported processing mode.
     * @returns {Promise<Object[]>} Per-email processing results in input order.
     * @throws {TypeError} If emails is not an array.
     * @throws {Error} If the processing mode is unsupported.
     */
    async function process(emails, mode) {
        if (!Array.isArray(emails)) {
            throw new TypeError("Input must be an array of emails.");
        }

        if (!supportedModes.includes(mode)) {
            throw new Error(`Unsupported processing mode: ${mode}`);
        }

        const processor = modes[mode];

        const results = new Array(emails.length);

        const usage = {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0,
        };

        let nextIndex = 0;

        async function processNext() {
            while (nextIndex < emails.length) {
                const index = nextIndex++;
                const email = emails[index];
                const emailId = email?.id;

                const validation = validateEmail(email, maxInputLength);

                if (validation.error) {
                    results[index] = {
                        id: emailId,
                        error: validation.error,
                    };

                    logger.warn?.("Email validation failed", {
                        emailId,
                        error: validation.error,
                    });

                    continue;
                }

                try {
                    const result = await processor.execute(validation.text);

                    if (result.usage) {
                        for (const key of Object.keys(usage)) {
                            const value = result.usage[key];

                            if (Number.isFinite(value) && value >= 0) {
                                usage[key] += value;
                            }
                        }
                    }

                    const { usage: _usage, ...publicResult } = result;

                    results[index] = {
                        id: emailId,
                        ...publicResult,
                    };
                } catch (error) {
                    results[index] = {
                        id: emailId,
                        error: "processing_failed",
                    };

                    logger.error?.("Email processing failed", {
                        emailId,
                        mode,
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                    });
                }
            }
        }

        const workerCount = Math.min(concurrency, emails.length);

        await Promise.all(
            Array.from({ length: workerCount }, () => processNext()),
        );

        const failed = results.filter((result) => result.error).length;

        logger.info?.("Batch processing completed", {
            mode,
            processed: emails.length,
            successful: emails.length - failed,
            failed,
            usage,
        });

        return results;
    }

    return {
        process,
        supportedModes,
    };
}

module.exports = { createProcessor };
