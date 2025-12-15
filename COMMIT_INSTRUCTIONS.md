# How to Commit Changes

## Current Status

✅ **Git is properly configured and working**
- User: krishanraja
- Email: hello@krishraja.com
- Branch: main
- Repository: `mindmaker-for-leaders`

## If You Cannot Commit from Cursor UI

### Option 1: Use Terminal/Command Line

1. **Open terminal in Cursor** (Terminal → New Terminal)
2. **Navigate to the project directory** (if not already there):
   ```bash
   cd mindmaker-for-leaders
   ```

3. **Check what needs to be committed**:
   ```bash
   git status
   ```

4. **Add files to staging**:
   ```bash
   git add .
   # Or add specific files:
   git add filename.txt
   ```

5. **Commit the changes**:
   ```bash
   git commit -m "Your commit message here"
   ```

### Option 2: Check for Issues

If commits are failing, check:

1. **Are there any changes to commit?**
   ```bash
   git status
   ```
   If it says "nothing to commit, working tree clean", there are no changes.

2. **Are files being tracked?**
   ```bash
   git ls-files --others --exclude-standard
   ```
   This shows untracked files that need to be added first.

3. **Check Git configuration**:
   ```bash
   git config --list
   ```

### Option 3: Commit New Files

If you have new files (like the pipeline improvements):

```bash
# Add all new files
git add PIPELINE_IMPROVEMENTS_COMPLETE.md
git add src/utils/databaseHelpers.ts
git add supabase/migrations/20250128000000_improve_rls_policies.sql
git add supabase/migrations/20250128000001_add_database_constraints.sql
git add supabase/migrations/20250128000002_create_atomic_assessment_insert.sql

# Commit them
git commit -m "feat: Add pipeline improvements - cleanup, rate limiting, RLS, constraints"
```

### Option 4: Commit Modified Files

If you have modified files:

```bash
# See what's modified
git status

# Add modified files
git add src/utils/runAssessment.ts
git add src/utils/cleanupFailedAssessment.ts
git add src/contexts/AssessmentContext.tsx

# Commit
git commit -m "feat: Improve data pipeline with cleanup and validation"
```

## Common Issues

### Issue: "Nothing to commit"
- **Solution**: Make sure you have changes. Check `git status` and `git diff`

### Issue: "Please tell me who you are"
- **Solution**: Already configured, but if needed:
  ```bash
  git config user.name "krishanraja"
  git config user.email "hello@krishraja.com"
  ```

### Issue: Cursor UI not working
- **Solution**: Use terminal commands instead (Option 1 above)

### Issue: Files not showing up
- **Solution**: Check `.gitignore` - files might be ignored

## Quick Reference

```bash
# Check status
git status

# Add all changes
git add .

# Commit with message
git commit -m "Your message"

# Push to remote (after committing)
git push origin main
```

## Current Branch Status

Your branch has diverged from origin/main:
- Local: 6 commits ahead
- Remote: 628 commits ahead

To sync:
```bash
git pull --rebase origin main
# Or
git fetch origin
git merge origin/main
```

