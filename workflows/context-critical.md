---
description: Essential context refresh for AI conversations
auto_execution_mode: 1
---

# Critical Context Refresh

This workflow loads the most critical constraints and patterns that AIs regularly forget, plus ways of working and current schema information.

## FIRST: Understand your core tools
Set the project working directory then run the following commands to determine the tool usage.
```bash
cmd /c node .windsurf\tools\schema-query.js --help
```

```bash
cmd /c node .windsurf\tools\file-delete.js --help
```

```bash
cmd /c npm run --prefix .windsurf\review review:repo -- --help
```

## Run critical workflows
**Execute these - do not skip**
/run context-cmd
/run context-review

## Git commit messages (required convention)
- Use no-spaces commit messages to avoid shell/quoting issues.
- Example: `git commit -m docs_update_ui_guidelines` (good)
- Avoid: `git commit -m "docs: update ui guidelines"` (spaces not allowed by convention)

## Guide loader hints (choose based on task)
- If working on API/server/auth/networking tasks: consider running `/run load-api-guides`.
- If working on UI/React/components/hooks tasks: consider running `/run load-ui-guides`.
- Core engineering guidance can be loaded anytime with `/run load-core-guides`.

## Load Current Schema Index
```bash
cmd /c node .windsurf\tools\schema-query.js --index
```
