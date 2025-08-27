---
description: Initialize new conversations with goal establishment and approval gating
auto_execution_mode: 1
---

# Hello AI - A New Chat Conversation Initialization

## Purpose
This workflow establishes conversation goals, loads critical context files and sets approval gates

##Step 1 - Load Critical Conext
- Set the project working directory
/run context-critical

## Step 1b - Load Core Engineering Guides (Always)
These short guides are always relevant and should be loaded for any task.
/run load-core-guides

## Step 1c - Load Task-Specific Guides (Choose one or both as needed)
- If the task involves API/server/auth/networking:
  /run load-api-guides
- If the task involves UI/React/components/hooks:
  /run load-ui-guides

### Step 2: Establish Goal(s)
**AI ACTION REQUIRED**: 
 - Establish the goal of this conversation.
 - Ask follow on questions until satisfied you have understood the goal.
 - **Important**: Questions should be asked one at a time.