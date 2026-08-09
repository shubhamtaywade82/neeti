# Claude Code Web: Token Efficiency & High-Quality Code Guide

This guide provides practical techniques to make Claude Code Web more token-efficient while producing high-quality code.

## Core Optimization Areas

1. **Context Size** — What Claude reads
2. **Task Decomposition** — How much Claude solves at once
3. **Verification Loop** — How quickly errors are caught

---

## 1. Use a "Context Diet"

Claude consumes tokens from everything it sees: files, errors, logs, previous conversation, and generated output.

### Do This

- Share only the relevant files
- Reference files instead of pasting:
  ```text
  Relevant file: src/services/order-service.ts
  Focus on validateOrder() and createOrder().
  ```
- For large files, provide only relevant sections
- For errors, paste only the important part:
  ```text
  Test failure:
  Expected: OrderStatus.PENDING
  Received: undefined
  at createOrder.spec.ts:45
  ```

### Avoid This

```text
Here is my whole repository:
[20 files pasted]
```

---

## 2. Use a Project Instruction File

Create persistent instructions for consistency:

```markdown
# Project Instructions

You are working on a TypeScript Node.js API.

Rules:
- Keep changes minimal
- Do not rewrite files unless asked
- Prefer small, focused functions
- Use existing utilities before adding new dependencies
- Maintain current code style
- Always preserve type safety
- Do not add comments unless they explain non-obvious behavior
- When changing code, output only modified sections unless asked for full file

Code style:
- TypeScript strict mode
- Prefer functional purity where practical
- Use zod for validation
- Use repository pattern for DB access
- Use Result objects instead of throwing for domain errors

Testing:
- Use vitest
- Test behavior, not implementation
- Prefer table-driven tests
- Mock external services only
```

---

## 3. Ask for a Plan Before Code

### Step 1: Plan
```text
I need to implement feature X.

Before writing code:
1. Identify the files likely to change
2. Propose the smallest safe implementation plan
3. List assumptions
4. List edge cases
5. Do not write full code yet
```

### Step 2: Implementation
```text
The plan looks good. Implement step 1 only:
[specific step]
```

---

## 4. Break Tasks into Small Units

Instead of: `Build the whole authentication system`

Use:
- `Implement only the refresh token rotation service`
- `Add validation for the create-order endpoint`

Small tasks produce fewer tokens, fewer hallucinations, easier review, better quality.

---

## 5. Use "Minimal Diff" Mode

```text
Make the smallest possible change required.
Do not refactor unrelated code.
Do not rewrite the whole file.
Show only the changed code, with file path and function name.
```

Example output format:
```text
File: src/services/order-service.ts

Replace createOrder():

[old code]

With:

[new code]
```

---

## 6. Ask for "Patch-Style" Responses

```text
Output format:
1. File path
2. Function or section to modify
3. Minimal replacement code
4. No unchanged code unless necessary
```

---

## 7. Give Acceptance Criteria

```text
Requirements:
- User can create an order only if cart is valid
- Order total must match server-side calculated total
- Prevent duplicate order submission using idempotency key
- Return 409 if idempotency key already used
- Do not expose internal inventory errors to client

Acceptance criteria:
- Existing tests still pass
- New behavior is covered by unit tests
- No new dependencies
```

---

## 8. Provide Examples of Desired Style

```text
Use the same style as this existing service:
src/services/payment-service.ts
```

Then paste only the relevant portion.

---

## 9. Make Claude Use Existing Code First

```text
Before adding new helpers, check whether an existing utility already solves this.
Prefer reusing existing abstractions.
If you need a new helper, justify why an existing one cannot be used.
```

---

## 10. Use Tests as the Quality Gate

```text
Write tests first for the following behavior:
- valid order creates order
- invalid cart returns validation error
- duplicate idempotency key returns conflict
- inventory failure returns domain error

Then implement the code to pass the tests.
```

---

## 11. Avoid Asking for Full Rewrites

Instead of: `Rewrite this file`

Use:
```text
Modify only the parts needed to support X.
Leave unrelated logic unchanged.
```

---

## 12. Use Local Tools to Reduce Round Trips

Use local tools for:
- Formatting
- Linting
- Type checking
- Test execution
- Dependency resolution

Then give Claude only the result:
```text
I ran: pnpm test src/orders
Only this test failed: createOrder should reject duplicate idempotency key
Error: [short error]
Fix only the failing behavior.
```

---

## 13. Use "Summarize Context" Between Long Sessions

```text
Summarize the current implementation state in 10 bullets:
- completed work
- remaining work
- important constraints
- files changed
```

Or create a checkpoint manually:
```markdown
# Current State

Implemented:
- Order validation
- Order repository
- Basic create order endpoint

Not implemented:
- Idempotency
- Inventory reservation rollback

Files:
- src/orders/order-service.ts
- src/orders/order-repository.ts

Next task:
Add idempotency key support.
```

---

## 14. Use a "No Speculation" Rule

```text
Do not speculate.
If information is missing, ask one targeted question.
Do not provide multiple alternative implementations unless requested.
```

---

## 15. Ask for Self-Review Before Final Code

```text
Before finalizing, check:
1. Does this satisfy the acceptance criteria?
2. Are there edge cases missing?
3. Are there type errors?
4. Are there security issues?
5. Does this break existing behavior?

If changes are needed, apply them.
Then output only the final changed code.
```

---

## 16. Use Strict Output Templates

### Template for Implementation
```text
## Assumptions
- ...

## Files to change
- ...

## Changes
File: ...
Function/section: ...
Change type: add | replace | remove
Code:
...

## Tests
...

## Risks
- ...
```

### Template for Minimal Changes
```text
File:
Location:
Change:
Code:
```

---

## 17. Use "One File at a Time"

```text
We will modify files one at a time.
Start with src/services/order-service.ts only.
Do not touch other files yet.
```

---

## 18. Prevent Unnecessary Comments and Documentation

```text
Do not add comments unless the logic is non-obvious.
Do not add JSDoc unless requested.
Do not explain unchanged code.
```

---

## 19. Use Precise Naming and File Paths

Instead of: `Fix the order bug`

Use:
```text
Fix the bug in src/services/order-service.ts where createOrder() returns undefined when cart.items is empty.
```

---

## 20. Prefer "Explain Briefly, Then Code"

```text
Give a 3-sentence implementation plan, then provide the code.
```

---

## 21. Use Code Generation in Layers

1. **Interface**: Define only the TypeScript interface
2. **Contract tests**: Write tests for public behavior
3. **Implementation**: Implement to satisfy tests
4. **Integration**: Connect to existing HTTP route

---

## 22. Tell Claude What Not to Do

```text
Do not:
- add new dependencies
- change the database schema
- rename public functions
- modify unrelated files
- rewrite the entire module
- add comments for obvious code
```

---

## 23. Use "Review Mode" Before Asking for Changes

```text
Review this code for bugs, edge cases, and security issues.
Do not rewrite it yet.
List only high-confidence issues.
```

Then: `Fix only issue #2 and #5.`

---

## 24. Use Existing Tests to Anchor Behavior

```text
The current behavior is defined by these tests:
[paste small relevant test]
Do not break them.
```

---

## 25. Use "Compact Prompts"

```text
Task: add idempotency to createOrder
Constraints:
- TypeScript
- no new deps
- preserve existing API
- return 409 on duplicate
Output:
- minimal changes only
- file + function + code
```

---

## Recommended Workflow

### Step 1: Define Task
```text
Task: Implement [specific feature]

Context:
- [file 1]
- [file 2]
- [relevant error/test/spec]

Constraints:
- minimal changes
- no new dependencies
- preserve existing behavior
- follow current code style

Acceptance criteria:
- [condition 1]
- [condition 2]

First, propose a short implementation plan only.
```

### Step 2: Approve Plan
```text
Use this plan, but implement only step 1.
Output minimal code changes only.
```

### Step 3: Validate Locally
```bash
pnpm test
pnpm typecheck
pnpm lint
```

Then return only failures:
```text
This failed:
[short failure]
Fix it with minimal changes.
```

### Step 4: Self-Review
```text
Review the change for:
- broken existing behavior
- edge cases
- type errors
- security issues

Then output final minimal patch.
```

---

## High-Quality Prompt Template

```text
You are modifying a production codebase.

Goal:
[specific goal]

Relevant files:
[file paths]

Requirements:
- [requirement 1]
- [requirement 2]

Constraints:
- Make the smallest possible change
- Do not rewrite unchanged code
- Do not add dependencies
- Do not change public APIs unless necessary
- Preserve existing behavior
- Follow existing code style
- Output only changed code unless asked

Acceptance criteria:
- [criteria 1]
- [criteria 2]

Before coding:
1. State assumptions
2. Identify files to change
3. Propose a minimal implementation plan

Do not write full code until I approve the plan.
```

After approval:
```text
Approved. Implement the plan now.
Output format:

File:
Function/section:
Change:
Code:
```

---

## Minimal-Token Prompt Template

```text
Modify [file path].
Change only [function/section].
Requirement: [requirement].
Do not rewrite the whole file.
Output only the replacement code for that section.
```

Example:
```text
Modify src/services/order-service.ts.
Change only createOrder().
Requirement: reject duplicate idempotency keys with ConflictError.
Do not rewrite the whole file.
Output only the replacement code for createOrder().
```

---

## Common Mistakes That Waste Tokens

| Mistake | Fix |
|---------|-----|
| Pasting too much code | Paste only relevant functions/files |
| Asking for full implementation immediately | Ask for plan first |
| Letting Claude rewrite whole files | Request minimal patches |
| Vague requirements | Provide acceptance criteria |
| Long conversation with stale context | Summarize and restart cleanly |
| Asking for explanations and code together | Request brief plan first, then code |
| Not using local tests/linters | Run checks locally, give Claude only failures |

---

## Best Practices Summary

### Reduce Context
- Only relevant files
- Only relevant errors
- No full logs unless necessary

### Use Project Rules
- Coding style
- Architecture constraints
- Output format

### Plan Before Code
- Assumptions
- Files to change
- Minimal implementation plan

### Implement Incrementally
- One file or one function at a time
- Avoid full rewrites

### Use Tests
- Write tests first if possible
- Fix failing tests only

### Ask for Minimal Diffs
- No unchanged code
- No unnecessary comments
- No speculative alternatives

### Verify Locally
- Run tests/typecheck/lint
- Return only concise failures

### Use Self-Review
- Check edge cases
- Check regressions
- Check security/type issues

---

## Simple Rule of Thumb

**For token efficiency:**
> Give less context, ask for smaller changes, use local verification.

**For high-quality code:**
> Give clear requirements, use tests, ask for review, enforce constraints.

> The best prompt is usually not the longest one. It is the one with **precise context, clear constraints, and a small implementation target**.
