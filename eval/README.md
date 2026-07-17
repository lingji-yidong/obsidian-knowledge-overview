# Generation Quality Evaluation

This framework generates fixed test chapters with the configured model. The
generator is the system under test; it is not used to judge its own output.
Local structural checks make no API calls, and a Codex agent can review the
saved artifacts afterward.

## Setup

```bash
cp .env.eval.example .env.eval.local
```

Fill in the provider URL, API key, and model ID. The local file and generated
runs are gitignored.

Important limits:

| Variable | Meaning |
| --- | --- |
| `EVAL_MAX_LOGICAL_REQUESTS` | Maximum planned generation calls |
| `EVAL_MAX_PHYSICAL_REQUESTS` | Maximum HTTP attempts, including compatibility fallback |
| `EVAL_MAX_COMPLETION_TOKENS` | Output limit for one case |
| `EVAL_MAX_TOTAL_TOKENS` | Total token ceiling for the run |
| `EVAL_CONCURRENCY` | Number of generation cases sent in parallel |
| `EVAL_REQUEST_TIMEOUT_MS` | Timeout for one HTTP attempt |

`EVAL_CONCURRENCY` controls parallel model calls. It does not control the
number of Codex reviewers.

Leave provider-specific fields blank unless the selected endpoint documents
them. `EVAL_THINKING_MODE=auto` omits the thinking field and works with models
that always reason or reject manual thinking controls.

## Run a Canary

Planning never calls the provider:

```bash
npm run eval:plan -- --case stem-fourier-aliasing
```

The plan prints a confirmation ID and its request/token ceiling. Supply that
exact ID to authorize the run:

```bash
npm run eval:generate -- --case stem-fourier-aliasing --confirm PLAN_ID
```

## Run a Profile

The `smoke` profile contains two STEM and two humanities cases. The
`model-comparison` profile contains the two harder comparison cases. The
`theory` profile contains chemical equilibrium, population genetics,
Lagrangian mechanics, and no-arbitrage option pricing.

```bash
npm run eval:plan -- --profile smoke
npm run eval:generate -- --profile smoke --confirm PLAN_ID
```

To run only the four theoretical cases:

```bash
npm run eval:plan -- --profile theory
npm run eval:generate -- --profile theory --confirm PLAN_ID
```

The `full` profile contains all 12 generation calls and requires explicitly
raising the request and total-token limits. Plan it first and read the printed
ceiling before changing `.env.eval.local`.

## Review a Run

Every completed case is checkpointed under `eval/runs/`. A run contains:

- generated Markdown;
- model and token provenance;
- local length, heading, scope, QA, and Obsidian math-delimiter checks;
- `agent-review-packet.md` for semantic review.

Regenerate local checks without calling the provider:

```bash
npm run eval:check -- --run eval/runs/RUN_ID
```

The review packet grades scope, concept sequence, consistency, QA
answerability, heading usefulness, learning efficiency, and STEM/humanities
fit. The scoring contract is defined in
[CODEX_REVIEW_SCHEMA.md](CODEX_REVIEW_SCHEMA.md).

The minimum length is a soft density target. A small shortfall produces a
warning; output below 80% of the target fails the local length floor. Semantic
quality is still decided by review, not by character count alone.

## Safety and Cost Controls

- Live generation requires the confirmation ID from the current dry run.
- Logical requests and physical HTTP attempts have separate caps.
- Successful cases are saved immediately.
- `SIGINT` and budget exhaustion stop queued work.
- The API key, authorization header, and full request body are never written to
  run artifacts.
- Failed cases can be rerun individually with `--case`.
