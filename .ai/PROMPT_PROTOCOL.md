# PROMPT PROTOCOL

## 1. Context

Preceding context, relevant history, or current state.

## 2. Goal

Single sentence describing what to achieve.

## 3. Files

List of files to read, create, or modify.

## 4. Rules

Constraints from AI_PROFILE.md plus task-specific rules.

## 5. Accept (A)

Verification gates required before completion. Acceptable: `typecheck`, `lint`, `test`, `build`.

## 6. Commit (CM)

Commit message if task requires commit.

---

## Short Commands

| Command | Action                   |
| ------- | ------------------------ |
| R       | Read `.ai/AI_PROFILE.md` |
| C       | Provide Context          |
| G       | State Goal               |
| F       | List Files               |
| RL      | State Rules              |
| A       | Specify Accept gates     |
| CM      | Provide Commit message   |

---

## Response Mode

PATCH_ONLY per AI_PROFILE.md.

**Output:**

1. Changed files
2. Verification
3. Blockers (if any)

**Verification format:**

```
✓ typecheck
✓ lint
✓ test
✓ build
```

or

```
✗ typecheck
✗ lint
✗ test
✗ build
```

or "Not Run"

**Rules:**

- Max 300 words
- No explanations
- No repeated requirements
- Minimal diff
- Reuse existing architecture
- No any
- No TODO
- Strict TypeScript
- Preserve public APIs

---

## Examples

### Example 1

```
R
G: Implement SX-022A
A: build lint test
```

### Example 2

```
R
G: Fix lint error
A: lint build
```

### Example 3

```
R
G: Refactor matching engine
A: typecheck lint build
```
