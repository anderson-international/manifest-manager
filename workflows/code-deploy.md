---
description: Deploy code from windsurf branch to main branch
---

# Code Deploy Workflow

**Objective**: Safely deploy changes from windsurf branch to main branch

**Process**: Validate → Commit → Push → Sync → Revert

## Core Rules

- **Must be on windsurf branch** - Stops execution if on wrong branch
- **All changes committed** - Ensures clean state before deployment
- **Safe branch switching** - Always returns to windsurf branch
- **Windows command syntax** - Uses `cmd /c` prefix for all git operations

## Deployment Sequence

### Step 1: Validate Current Branch
```bash
# // turbo
cmd /c git branch --show-current
```

**CRITICAL**: If output is not "windsurf", **STOP WORKFLOW**
- Current branch must be `windsurf`
- Do not proceed if on any other branch

### Step 2: Commit and Push All Changes
```bash
# // turbo
cmd /c git add .
cmd /c git status --porcelain
cmd /c git commit -m Deploy-Auto-commit-before-branch-sync
cmd /c git push origin windsurf
```

**Note**: 
- Commits all pending changes with auto-generated message
- Pushes to windsurf branch to ensure remote is up-to-date
- If no changes to commit, git will skip commit step automatically

### Step 3: Switch to Main Branch
```bash
# // turbo
cmd /c git checkout main
cmd /c git branch --show-current
```

**Verification**: Confirm we're now on `main` branch

### Step 4: Sync Main with Windsurf Branch
```bash
# // turbo
cmd /c git pull origin main
cmd /c git merge windsurf --no-ff -m Deploy-Merge-windsurf-branch-to-main
cmd /c git push origin main
```

**Actions**:
- Pull latest main branch changes (if any)
- Merge windsurf branch into main with no fast-forward
- Push updated main branch to remote

### Step 5: Return to Windsurf Branch
```bash
# // turbo
cmd /c git checkout windsurf
cmd /c git branch --show-current
```

**Final State**: Back on windsurf branch, ready for continued development

## Safety Features

### Pre-Deployment Validation
- ✅ Branch validation prevents deployment from wrong branch
- ✅ All changes committed before branch operations
- ✅ Remote windsurf branch updated before merge

### Post-Deployment Safety
- ✅ Always returns to windsurf branch
- ✅ No-fast-forward merge preserves commit history
- ✅ Both local and remote main branches updated

## Error Handling

**If Step 1 fails (wrong branch)**:
```
❌ ERROR: Not on windsurf branch
Current branch: [detected-branch]
Required: windsurf

ACTION: Switch to windsurf branch manually:
cmd /c git checkout windsurf
```

**If merge conflicts occur in Step 4**:
```
❌ ERROR: Merge conflicts detected
ACTION: Resolve conflicts manually, then:
cmd /c git add .
cmd /c git commit -m Resolve-merge-conflicts
cmd /c git push origin main
cmd /c git checkout windsurf
```

## Completion Checklist
- ✅ Started on windsurf branch
- ✅ All changes committed and pushed to windsurf
- ✅ Successfully switched to main branch
- ✅ Main branch synced with windsurf changes
- ✅ Main branch pushed to remote
- ✅ Returned to windsurf branch

## Command Reference

| Purpose | Command |
|---------|---------|
| Check current branch | `cmd /c git branch --show-current` |
| Add all changes | `cmd /c git add .` |
| Check status | `cmd /c git status --porcelain` |
| Commit changes | `cmd /c git commit -m message-with-hyphens` |
| Push branch | `cmd /c git push origin [branch]` |
| Switch branch | `cmd /c git checkout [branch]` |
| Merge branch | `cmd /c git merge [branch] --no-ff -m message-with-hyphens` |
| Pull latest | `cmd /c git pull origin [branch]` |

**Deployment Philosophy**: Safe, predictable, and always returns to development state (windsurf branch).
