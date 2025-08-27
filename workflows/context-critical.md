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

## Load Current Schema Index
```bash
cmd /c node .windsurf\tools\schema-query.js --index
```
