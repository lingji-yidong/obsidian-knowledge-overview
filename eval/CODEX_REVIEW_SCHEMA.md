# Codex semantic review contract

The model configured for the run is the generator under test. Codex reviews
the saved files and local metrics independently; the batch runner never calls
the generator or another model as a quality judge.

Write `codex-review.json` beside the run manifest:

```json
{
  "schemaVersion": 1,
  "runId": "run-id",
  "reviewer": "codex",
  "cases": [
    {
      "id": "case-id",
      "verdict": "pass | warn | fail",
      "scores": {
        "scopeFidelity": 1,
        "conceptSequence": 1,
        "internalConsistency": 1,
        "qaAnswerability": 1,
        "headingUtility": 1,
        "learningEfficiency": 1,
        "domainFit": 1
      },
      "qa": [
        {
          "question": "question text",
          "verdict": "explicit | derivable | unsupported | ambiguous",
          "bodySection": "exact H2 or null",
          "bodyEvidence": "short exact excerpt or null",
          "missingTeaching": []
        }
      ],
      "issues": [
        {
          "severity": "critical | major | minor",
          "category": "scope | sequence | consistency | qa | headings | length | domain-fit | factual",
          "evidence": "specific evidence from the generated chapter",
          "recommendation": "prompt or product-level correction"
        }
      ]
    }
  ],
  "aggregate": {
    "stemVerdict": "pass | warn | fail",
    "humanitiesVerdict": "pass | warn | fail",
    "unsupportedQaRate": 0,
    "goNoGo": "go | no-go"
  }
}
```

Scores must be integers from 1 to 5. Review the body before the final QA section when judging whether a question was taught. `Derivable` may combine at most two explicit body claims; outside facts, new definitions, new formulas, and new procedures make a question `unsupported`.

The configured chapter minimum is a soft density target, not an automatic
semantic failure. A chapter at or above 80% of that target may pass when its
scope, teaching depth, and QA remain strong. Output below the 80% structural
floor is a length failure; excessive length remains a failure because this
project is designed for rapid review rather than textbook sprawl.
