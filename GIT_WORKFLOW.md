# Git Workflow Guide

## 🔄 Development Workflow

This project follows a **feature branch workflow** with automated testing and semantic versioning.

---

## 📋 Quick Start

### 1. Create a Feature Branch

```bash
# Update main branch
git checkout main
git pull origin main

# Create and checkout feature branch
git checkout -b feat/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

### 2. Make Changes

```bash
# Make your changes
# ... edit files ...

# Stage changes
git add .

# Commit with conventional format
git commit -m "feat(scope): description of changes"
```

### 3. Push and Create PR

```bash
# Push your branch
git push origin feat/your-feature-name

# Go to GitHub and create Pull Request
# CI will automatically run tests
```

### 4. Wait for CI and Review

- ✅ All CI checks must pass
- ✅ Code review approval required
- ✅ Commit messages validated

### 5. Merge PR

- Use **"Squash and merge"** (recommended)
- Automated versioning will create release
- Branch will be deleted automatically

---

## 🌿 Branch Naming Convention

Use descriptive branch names that indicate the type and purpose:

### Feature Branches
```bash
feat/live-points-tracking
feat/add-transfer-suggestions
feature/price-change-tracker
```

### Bug Fix Branches
```bash
fix/captain-points-calculation
fix/responsive-layout-issue
bugfix/cache-timeout-error
```

### Documentation Branches
```bash
docs/update-readme
docs/add-api-documentation
```

### Refactoring Branches
```bash
refactor/optimize-cache-logic
refactor/clean-up-components
```

### Chore/Maintenance Branches
```bash
chore/update-dependencies
chore/improve-docker-build
```

---

## 💬 Commit Message Format

### Structure

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type | When to Use | Version Bump |
|------|------------|--------------|
| `feat` | New feature | MINOR |
| `fix` | Bug fix | PATCH |
| `docs` | Documentation only | PATCH |
| `style` | Code style (formatting, etc.) | PATCH |
| `refactor` | Code refactoring | PATCH |
| `perf` | Performance improvement | PATCH |
| `test` | Adding/updating tests | PATCH |
| `chore` | Build/tooling changes | PATCH |
| `feat!` | Breaking feature | MAJOR |
| `fix!` | Breaking fix | MAJOR |

### Examples

```bash
# Feature (MINOR bump)
feat(backend): add price change tracking endpoint

# Bug fix (PATCH bump)
fix(frontend): resolve responsive layout on mobile devices

# Breaking change (MAJOR bump)
feat(api)!: redesign team comparison response structure

BREAKING CHANGE: The comparison endpoint now returns a different format

# Documentation (PATCH bump)
docs: update API endpoint documentation

# Chore (PATCH bump)
chore(deps): update next to v14.2.0
```

---

## 🔍 CI/CD Pipeline

When you create a PR, the following checks run automatically:

### ✅ Automated Checks

1. **Lint Check**
   - Code style validation
   - ESLint rules

2. **Build Test**
   - Backend structure verification
   - Frontend build (Next.js)

3. **Docker Build**
   - Backend image build
   - Frontend image build

4. **Configuration Validation**
   - docker-compose.yml syntax
   - package.json validity
   - Secrets detection

5. **Commit Message Validation**
   - Conventional commits format
   - Type validation

### 📊 Status Checks

All checks must pass before merging:

```
✓ Lint Code
✓ Build & Test
✓ Docker Build Test
✓ Validate Configuration
✓ Lint Commit Messages
✓ All Checks Passed
```

---

## 🔀 Pull Request Process

### Creating a PR

1. **Push your branch:**
   ```bash
   git push origin feat/your-feature
   ```

2. **Go to GitHub:**
   - Navigate to repository
   - Click "Compare & pull request"

3. **Fill PR template:**
   - Describe changes
   - Mark type of change
   - List changes made
   - Add screenshots if UI changes
   - Complete checklist

4. **Submit PR:**
   - CI checks will run automatically
   - Address any failures

### PR Review

- Wait for CI checks to pass
- Request review from team members
- Address review comments
- Make additional commits if needed

### Merging

**When all checks pass and approved:**

1. **Squash and Merge** (recommended)
   - Combines all commits into one
   - Clean git history
   - Single commit triggers versioning

2. **Merge Commit** (alternative)
   - Preserves all individual commits
   - More detailed history

3. **Rebase and Merge** (advanced)
   - Linear history
   - Individual commits preserved

**After merge:**
- Automated versioning runs
- New version created based on commit type
- GitHub release generated
- CHANGELOG updated

---

## 🏷️ Automated Versioning

### How It Works

When PR is merged to `main`:

1. **Commit analysis:**
   ```
   feat: add feature    → MINOR (v2.0.0 → v2.1.0)
   fix: fix bug        → PATCH (v2.0.0 → v2.0.1)
   feat!: breaking     → MAJOR (v2.0.0 → v3.0.0)
   ```

2. **Version update:**
   - All `package.json` files updated
   - CHANGELOG.md updated
   - Git tag created

3. **Release creation:**
   - GitHub release with notes
   - Tag pushed to repository

### Version Bump Rules

**Highest type wins:**
- If PR has both `feat` and `fix` → MINOR bump
- If PR has `feat!` and `fix` → MAJOR bump

---

## 🛠️ Common Workflows

### Working on a Feature

```bash
# 1. Create branch
git checkout -b feat/add-fixture-analyzer

# 2. Make changes
# ... code ...

# 3. Commit frequently
git add .
git commit -m "feat(backend): add fixture difficulty calculation"

# 4. Keep branch updated
git fetch origin
git rebase origin/main

# 5. Push when ready
git push origin feat/add-fixture-analyzer

# 6. Create PR on GitHub
```

### Fixing a Bug

```bash
# 1. Create fix branch
git checkout -b fix/points-calculation-error

# 2. Make fix
# ... code ...

# 3. Commit with fix type
git commit -m "fix(backend): correct captain multiplier calculation

The captain points were not being multiplied by 2 in certain edge cases.
This fix ensures the multiplier is always applied correctly.

Fixes #42"

# 4. Push and create PR
git push origin fix/points-calculation-error
```

### Updating Documentation

```bash
# 1. Create docs branch
git checkout -b docs/update-api-docs

# 2. Update docs
# ... edit .md files ...

# 3. Commit
git commit -m "docs: add examples for comparison endpoint"

# 4. Push and create PR
git push origin docs/update-api-docs
```

---

## 🚫 What NOT to Do

### ❌ Don't:

- Push directly to `main` branch
- Merge without CI passing
- Use generic commit messages ("fix", "update")
- Skip PR process for "small changes"
- Force push to `main` branch
- Delete `main` branch protection

### ✅ Do:

- Always work in feature branches
- Write descriptive commit messages
- Wait for CI checks before merging
- Request code reviews
- Keep branches up to date with main
- Delete merged branches

---

## 🔒 Branch Protection Rules

The `main` branch is protected:

- ✅ Require pull request before merging
- ✅ Require status checks to pass
- ✅ Require conversation resolution
- ✅ No force pushes
- ✅ No deletions
- ⚠️ Require at least 1 approval (recommended)

---

## 📊 Example Workflow

### Real-World Example

```bash
# Day 1: Start new feature
git checkout main
git pull
git checkout -b feat/transfer-suggestions

# Make changes
npm run dev
# ... develop feature ...

# Commit progress
git add backend/src/services/transferAnalyzer.js
git commit -m "feat(backend): add transfer suggestion algorithm

Implements fixture analysis and form tracking to suggest optimal transfers."

# Day 2: Continue work
# ... more development ...

git add frontend/src/components/TransferSuggestions.js
git commit -m "feat(frontend): add transfer suggestions UI component"

# Ready for review
git push origin feat/transfer-suggestions

# Create PR on GitHub
# - Fill out template
# - Wait for CI (all green ✓)
# - Request review
# - Address feedback
# - Get approval
# - Squash and merge

# Result: v2.1.0 automatically released!
```

---

## 🎯 Best Practices

### Commits

- **Atomic commits:** One logical change per commit
- **Good messages:** Clear, descriptive, follow convention
- **Frequent commits:** Commit often, push when ready

### Branches

- **Short-lived:** Keep branches small and focused
- **Up-to-date:** Regularly rebase on main
- **Descriptive names:** Clear purpose from name

### Pull Requests

- **Small PRs:** Easier to review (< 500 lines preferred)
- **Good descriptions:** Use PR template
- **Link issues:** Reference related issues
- **Self-review:** Review your own PR first

---

## 🆘 Troubleshooting

### CI Checks Failing?

```bash
# Run checks locally before pushing
npm run lint      # In backend/frontend
npm run build     # In frontend
docker-compose config  # Validate docker-compose
```

### Commit Message Invalid?

```bash
# Amend last commit message
git commit --amend -m "feat: correct commit message format"

# For older commits, use interactive rebase
git rebase -i HEAD~3
# Change 'pick' to 'reword' for commits to fix
```

### Branch Out of Date?

```bash
# Rebase on main
git fetch origin
git rebase origin/main

# Resolve conflicts if any
# Then force push (safe for feature branches)
git push --force-with-lease origin your-branch
```

### Merge Conflicts?

```bash
# Update branch
git checkout main
git pull
git checkout your-branch
git merge main

# Resolve conflicts in editor
git add .
git commit -m "chore: resolve merge conflicts"
git push
```

---

## 📚 Resources

- **Conventional Commits:** https://www.conventionalcommits.org/
- **Semantic Versioning:** https://semver.org/
- **CONTRIBUTING.md:** [Contributing Guide](CONTRIBUTING.md)
- **VERSIONING.md:** [Versioning Guide](VERSIONING.md)

---

## 🎓 Quick Reference

```bash
# Create feature branch
git checkout -b feat/my-feature

# Commit with convention
git commit -m "feat(scope): description"

# Push and create PR
git push origin feat/my-feature

# After merge, update main
git checkout main
git pull origin main

# Start next feature
git checkout -b feat/next-feature
```

---

**Questions?** Check documentation or open a discussion on GitHub!
