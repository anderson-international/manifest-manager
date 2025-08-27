---
description: Autonomously refresh relevant context files based on current work
---

# Autonomous Context Refresh

## Purpose
Autonomously load the most relevant context workflows based on recent work.

## Step 1: Select Relevant Workflows
Choose workflows based on recent tasks and current development focus.

## Step 2: Execute Workflows
// turbo
**CRITICAL: Execute workflows by viewing `.windsurf/workflows/[name].md` and running the commands inside.**

**Example:**
- For `/tech-react-forms`: View `.windsurf/workflows/tech-react-forms.md` → Execute its `cmd /c node .windsurf\tools\docs-loader.js` commands
- Never call `docs-loader.js tech-react-forms` directly

## Step 3: Report Summary
- What contexts were loaded and why
- Key insights gained
- How the context supports current/future work