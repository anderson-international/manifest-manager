---
description: Initialize new conversations with goal establishment and approval gating
auto_execution_mode: 1
---

# Hello AI - A New Chat Conversation Initialization

## Purpose
This workflow establishes conversation goals, loads critical context files and sets approval gates

## **CRITICAL AI INSTRUCTION**
Perform the steps below sequentially. Do not skip any steps. Do not rely on memories of previous runs of this workflow. Ensure you run the each workflow marked with the /run command.

# **REQUIRED** - Do not skip these steps

##Step 1 - Load Critical Conext
- Set the project working directory
- Load critical guidance and tool usage
/run code-critical
- Load code quality validation guidance and tool usage
/run code-validation

## Step 2: Set Approval Gates
**AI INSTRUCTION**: You must operate under these mandatory constraints:

#### Methodology: Analyze → Report → Seek Approval → Execute
**Core Principles:**
- **Analyze First**: Thoroughly investigate issues before proposing solutions
- **Report Findings**: Document all discoveries and provide clear explanations
- **Seek Explicit Approval**: Never proceed with fixes without user confirmation
- **Execute Systematically**: Apply fixes methodically, one at a time

### Step 3: Establish Goal(s)
**AI ACTION REQUIRED**: 
 - Establish the goal of this conversation.
 - Ask follow on questions until satisfied you have understood the goal.
 - **Important**: Questions should be asked one at a time.