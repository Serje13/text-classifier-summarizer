# Text Classifier / Summarizer

A modular Node.js application that classifies short text messages into predefined topics or generates one-to-two-sentence summaries using the Groq API.

The application supports AWS Lambda execution and a local command-line interface.

## Features

- **Text classification** — assigns one or more predefined topics to each input message.
- **Text summarization** — generates a concise summary of one or two sentences.
- **Independent processing** — invalid or failed items do not prevent other items in the batch from being processed.
- **Modular architecture** — separates application orchestration, business logic, prompts, configuration, and model integration.
- **Model abstraction** — uses a provider-independent model interface to simplify future integrations.
- **Configurable processing** — supports configurable input limits, output token limits, and concurrency.
- **Cost awareness** — tracks token usage and limits input size, output tokens, and concurrent requests.
- **Structured logging** — provides configurable log levels and structured JSON log entries.

## Architecture

```text
app/
  create-app.js       Application composition and dependency initialization
  handler.js          AWS Lambda entry point
  run.js              CLI entry point

config/
  index.js            Environment-based configuration
  logging.js          Logging levels
  modes.js            Supported processing modes
  topics.js           Allowed classification topics

core/
  parse-json-response.js
                      LLM response parsing and validation
  processor.js        Batch processing and concurrency control
  validate-email.js   Input validation

logger/
  index.js            Structured logger implementation

models/
  text-model.js       Provider-independent model interface
  groq.adapter.js     Groq API implementation

modes/
  classifier.js       Classification logic
  summarizer.js       Summarization logic

prompts/
  classifier.js       Classification prompts
  summarizer.js       Summarization prompts

sample/
  emails.json         Sample input data

scripts/
  groq-smoke.js       Groq integration smoke test
  modes-smoke.js      Processing modes smoke test

test/
  app/
    handler.test.js              AWS Lambda handler tests
    run.test.js                  CLI execution and argument parsing tests
  config/
    index.test.js                Configuration loading and validation tests
  core/
    parse-json-response.test.js  AI response JSON parsing tests
    processor.test.js            Batch processing, concurrency, and error handling tests
    validate-email.test.js       Email input validation tests
  modes/
    classifier.test.js           Text classification tests
    summarizer.test.js           Text summarization tests
  models/
    groq.adapter.test.js         Groq API adapter tests
```

### Processing flow

1. The application receives an array of email-like objects and a processing mode.
2. The processor validates each item independently.
3. Valid items are passed to the selected processing mode.
4. The mode builds the appropriate prompt and calls the model through the `TextModel` interface.
5. The model response is parsed and validated.
6. Results are returned in the original input order.
7. Processing failures are logged and represented as individual error results.

### Model abstraction

`TextModel` defines the provider-independent `generate()` interface. `GroqAdapter` implements that interface using the Groq SDK.

This keeps classification and summarization independent of provider-specific API calls. A different provider can be integrated by implementing the same interface and updating application composition in `app/create-app.js`.

## Requirements

- Node.js 24 or later
- npm
- A Groq API key
- Outbound network access to the Groq API

## Configuration

Create a local environment file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

On Windows Command Prompt (CMD):

```cmd
copy .env.example .env
```

Configure the variables described in the [Environment variables](#environment-variables) section. The `.env` file is excluded from Git.

Numeric configuration values must be positive integers. An invalid value stops application initialization.

## Groq API Setup

The application uses the Groq API to access an LLM. A Groq account and API key are required. No local LLM installation is necessary.

Open the official [Groq Console](https://console.groq.com/) to manage your account and API keys.

### Obtaining an API key

1. Open the Groq Console.
2. Sign in or create a Groq account.
3. Navigate to the API Keys section.
4. Generate a new API key and copy it.

### Environment configuration

Create a local `.env` file from `.env.example`:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

On Windows Command Prompt (CMD):

```cmd
copy .env.example .env
```

Set your Groq API key in `.env`:

```env
GROQ_API_KEY=your_groq_api_key
```

The model has a default, so `GROQ_MODEL` is optional. To configure it explicitly:

```env
GROQ_MODEL=openai/gpt-oss-120b
```

Refer to the existing Configuration section for the other supported environment variables and defaults.

### Verifying the connection

Check communication with the Groq API:

```bash
npm run smoke:groq
```

Check the classification and summarization modes using the configured model:

```bash
npm run smoke:modes
```

These commands are live smoke tests and require a valid API key. They do not deploy the application.

### API key security

- Never commit `.env` to version control.
- Never expose or share the Groq API key.
- `.env` is excluded from Git through `.gitignore`.
- `.env.example` contains configuration placeholders and can safely be committed.

## Installation

```bash
npm install
```

For a clean reproducible installation:

```bash
npm ci
```

On Windows PowerShell, if npm commands are blocked by the system's ExecutionPolicy, use the `.cmd` alternatives:

```powershell
npm.cmd ci
npm.cmd test
```

These are Windows-specific alternatives to the standard cross-platform npm commands.

## Local execution

The application provides two processing modes: `classify` and `summarize`.

### Input format

The input file must contain a JSON array:

```json
[
  {
    "id": 1,
    "subject": "Invoice #1234 overdue",
    "body": "Dear customer, your invoice is overdue."
  },
  {
    "id": 2,
    "subject": "Weekly engineering sync",
    "body": "Agenda: architecture updates and technical discussions."
  },
  {
    "id": 3,
    "subject": "",
    "body": " "
  }
]
```

The `subject` and `body` fields must be strings. Either field may be empty, but the combined trimmed text must not be empty. The `id` field is optional.

### Classification

```bash
node app/run.js --input sample/emails.json --mode classify
```

Example output:

```json
[
  {
    "id": 1,
    "topics": ["finance"]
  },
  {
    "id": 2,
    "topics": ["technical"]
  },
  {
    "id": 3,
    "error": "empty_input"
  }
]
```

Supported classification topics:

- `finance`
- `technical`
- `hr`
- `marketing`
- `other`

Duplicate topics returned by the model are removed. An item may be assigned multiple topics when appropriate.

### Summarization

```bash
node app/run.js --input sample/emails.json --mode summarize
```

Example output:

```json
[
  {
    "id": 1,
    "summary": "The customer is being notified that invoice #1234 is overdue."
  }
]
```

The summarizer prompt instructs the model to produce one or two sentences. The response is also validated at runtime before it is returned.

### CLI options

| Option | Description |
|---|---|
| `--input` | Path to the input JSON file |
| `--mode` | Processing mode: `classify` or `summarize` |
| `--log-level` | Logging level: `DEBUG`, `INFO`, `WARN`, or `ERROR` |
| `--help` | Display usage information |

Example:

```bash
node app/run.js --input sample/emails.json --mode classify --log-level INFO
```

The CLI writes JSON results to standard output and structured logs to standard error.

## AWS Lambda

The Lambda handler is located at `app/handler.js`.

Use the Node.js 24.x runtime and configure the handler as:

```text
app/handler.handler
```

### Deployment

To deploy the application to AWS Lambda:

1. Use the Node.js 24.x runtime.
2. Set the handler to `app/handler.handler`.
3. Install production dependencies:

   ```bash
   npm ci --omit=dev
   ```

4. Create a deployment package containing:

   ```text
   app/
   config/
   core/
   logger/
   models/
   modes/
   prompts/
   node_modules/
   ```

5. Configure the environment variables in the Lambda function settings.
6. Ensure the Lambda execution environment has outbound network access to the Groq API.
7. Exclude `.env`, test files, local development artifacts, coverage output, and logs from the deployment package.

The application initializes lazily and reuses the initialized application instance across warm Lambda invocations.

### Event format

The Lambda handler accepts an object containing a supported processing mode and an array of emails:

```json
{
  "mode": "classify",
  "emails": [
    {
      "id": 1,
      "subject": "Invoice overdue",
      "body": "Your invoice is overdue."
    },
    {
      "id": 2,
      "subject": "Engineering meeting",
      "body": "The team will discuss architecture updates."
    }
  ]
}
```

Supported modes are:

- `classify`
- `summarize`

Each email must contain string `subject` and `body` fields. One field may be empty, but the combined trimmed text must not be empty. The subject and body are trimmed and joined with two newline characters before processing.

The maximum combined text length is controlled by `MAX_INPUT_LENGTH` and defaults to `10000` characters.

The `id` field is optional and is copied to the corresponding result when provided.

An empty `emails` array is valid and returns an empty array.

### Response format

The handler returns the result array directly, without a wrapper object:

```json
[
  {
    "id": 1,
    "topics": ["finance"]
  },
  {
    "id": 2,
    "topics": ["technical"]
  }
]
```

Summarization returns `summary` instead of `topics`:

```json
[
  {
    "id": 1,
    "summary": "The customer is being notified that the invoice is overdue."
  }
]
```

A failed email returns an error in the corresponding position:

```json
[
  {
    "id": 1,
    "error": "processing_failed"
  }
]
```

### Lambda environment variables

Configure the same environment variables in the Lambda function:

| Variable | Required | Default | Description |
|---|---|---|---|
| `GROQ_API_KEY` | Yes | — | API key used to authenticate with Groq. |
| `GROQ_MODEL` | No | `openai/gpt-oss-120b` | Groq model identifier. |
| `MAX_INPUT_LENGTH` | No | `10000` | Maximum combined email text length in characters. |
| `MAX_OUTPUT_TOKENS` | No | `300` | Maximum completion tokens per model request. |
| `PROCESSING_CONCURRENCY` | No | `3` | Maximum number of emails processed concurrently. |
| `LOG_LEVEL` | No | `INFO` | Minimum logging level: `DEBUG`, `INFO`, `WARN`, or `ERROR`. |

The application initializes its dependencies lazily and reuses the initialized application instance across warm Lambda invocations.

## Error handling

Email validation and processing are handled independently for each item.

Supported validation errors:

- `empty_input` — subject and body contain no meaningful text.
- `invalid_email` — input does not have the expected object and string fields.
- `input_too_long` — combined text exceeds the configured maximum length.

Unexpected processing errors are logged and returned as:

```json
{
  "id": 1,
  "error": "processing_failed"
}
```

A failure in one item does not stop processing of the remaining emails. Each result is stored by its original input index.

Invalid batch-level input, such as a non-array `emails` value or an unsupported mode, causes the Lambda handler or processor to throw an error instead of returning per-item results.

Automatic retries are not implemented.

## Cost awareness

The application includes several mechanisms to control LLM usage:

- Maximum input length is configurable.
- Maximum completion tokens are configurable.
- Batch processing uses bounded concurrency.
- Token usage is collected from the model response.
- Prompt and completion token usage is included in structured batch completion logs.

The application does not implement monetary cost calculation, caching, or automatic retries.

## Testing

Run the automated test suite:

```bash
npm test
```

The test suite covers:

- Environment configuration and validation.
- Input validation and JSON response parsing.
- Classification and summarization behavior.
- Summary sentence-count validation.
- Groq adapter request and response handling.
- Batch processing and concurrency.
- Result ordering.
- Per-item error handling.
- Lambda event validation and handler initialization.
- CLI argument parsing and execution.

The automated test suite currently contains 52 tests.

### Integration smoke tests

The integration smoke tests make real requests to the Groq API:

```bash
npm run smoke:groq
npm run smoke:modes
```

They require a valid `GROQ_API_KEY` and consume API tokens.

The regular `npm test` command does not require live API calls.

## Assumptions and design decisions

- Input messages are represented by objects containing `subject` and `body`, with an optional `id`.
- The subject and body are combined into a single text input.
- Classification topics are predefined and centrally configured.
- The model is instructed to return structured JSON responses.
- Invalid items are reported individually rather than failing the entire batch.
- The original input order is preserved regardless of processing concurrency.
- The Groq API is used as the external LLM backend, with model selection configurable through environment variables.
