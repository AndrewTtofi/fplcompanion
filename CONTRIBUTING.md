# Contributing to FPL Companion

Thank you for considering contributing to FPL Companion! This document outlines the process and guidelines.

---

## 📋 Table of Contents

- [Commit Message Convention](#commit-message-convention)
- [Semantic Versioning](#semantic-versioning)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)
- [Testing](#testing)

---

## 📝 Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages. This enables automated semantic versioning and changelog generation.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

Use these commit types to trigger the appropriate version bump:

#### MAJOR Version Bump (Breaking Changes)
```bash
# Format 1: Using BREAKING CHANGE in footer
feat: add new API endpoint

BREAKING CHANGE: removed /api/old-endpoint

# Format 2: Using ! after type
feat!: redesign team comparison API

# Format 3: Explicit breaking keyword
breaking: remove support for old data format
```

**When to use:**
- Removing features or endpoints
- Changing API response structure
- Incompatible database schema changes
- Major UI/UX changes that break existing workflows

#### MINOR Version Bump (New Features)
```bash
feat: add live points tracking
feat(comparison): add team differential analysis
feature: implement pitch view
```

**When to use:**
- New features
- New API endpoints (backward-compatible)
- New UI components
- Enhanced functionality

#### PATCH Version Bump (Bug Fixes & Minor Changes)
```bash
fix: correct points calculation for captain
fix(ui): resolve responsive layout issue
chore: update dependencies
docs: improve README instructions
style: format code with prettier
refactor: optimize cache logic
perf: improve API response time
test: add unit tests for comparison service
```

**When to use:**
- Bug fixes
- Performance improvements
- Documentation updates
- Code refactoring (no feature change)
- Dependency patches
- Test additions

#### No Version Bump
```bash
chore: update gitignore [skip ci]
docs: fix typo in README
ci: update GitHub Actions workflow
```

**When to use:**
- Changes that don't affect users
- CI/CD configuration
- Build scripts

### Scope (Optional)

Specify the area of change:

```bash
feat(backend): add comparison endpoint
fix(frontend): resolve data loading issue
docs(api): update endpoint documentation
chore(docker): optimize production build
```

**Common scopes:**
- `backend` - Backend API changes
- `frontend` - Frontend UI changes
- `api` - API-specific changes
- `ui` - UI/UX changes
- `docker` - Docker/deployment changes
- `docs` - Documentation
- `test` - Testing

### Examples

#### Feature Addition (MINOR bump)
```bash
feat(backend): add real-time live points tracking

- Implement getLiveTeamPoints() method
- Add /api/team/:id/live/:gw endpoint
- Include fixture information per player
- Calculate captain multiplier automatically

Closes #15
```

#### Bug Fix (PATCH bump)
```bash
fix(frontend): correct captain points display

Captain points were not being multiplied correctly
in the pitch view component.

Fixes #23
```

#### Breaking Change (MAJOR bump)
```bash
feat(api)!: restructure team overview response

BREAKING CHANGE: The team overview endpoint now returns
a different data structure. The 'performance' object has
been moved to the root level.

Migration guide:
- Old: response.team.performance.overall_points
- New: response.performance.overall_points

Closes #30
```

#### Dependency Update (PATCH bump)
```bash
chore(deps): update next to v14.1.0

Security patch for Next.js
```

---

## 🔄 Semantic Versioning

We use [Semantic Versioning](https://semver.org/) (SemVer):

```
MAJOR.MINOR.PATCH
```

### Version Format: `vX.Y.Z`

- **MAJOR (X)**: Breaking changes
- **MINOR (Y)**: New features (backward-compatible)
- **PATCH (Z)**: Bug fixes (backward-compatible)

### Examples

| Version | Type | Example Changes |
|---------|------|-----------------|
| `1.0.0` → `2.0.0` | MAJOR | Removed old API endpoint, changed response format |
| `1.0.0` → `1.1.0` | MINOR | Added live points feature, new comparison endpoint |
| `1.0.0` → `1.0.1` | PATCH | Fixed calculation bug, updated documentation |

### Automatic Versioning

Version bumps happen automatically on merge to `main`:

1. **Commit messages are analyzed** for type keywords
2. **Highest version bump wins** (MAJOR > MINOR > PATCH)
3. **Version is updated** in all `package.json` files
4. **Git tag is created** (e.g., `v2.1.0`)
5. **GitHub Release is created** with changelog
6. **CHANGELOG.md is updated** automatically

---

## 🔧 Development Workflow

### 1. Fork & Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/fplcompanion.git
cd fplcompanion
git remote add upstream https://github.com/AndrewTtofi/fplcompanion.git
```

### 2. Create a Feature Branch

```bash
git checkout -b feat/your-feature-name
# or
git checkout -b fix/bug-description
```

**Branch naming:**
- `feat/feature-name` - New features
- `fix/bug-name` - Bug fixes
- `docs/description` - Documentation
- `chore/description` - Maintenance
- `refactor/description` - Code refactoring

### 3. Make Changes

Follow the project structure:
- Backend code: `/backend/src/`
- Frontend code: `/frontend/src/`
- Docker configs: Root directory
- Docs: Root directory

### 4. Test Locally

```bash
# Start the application
docker-compose up --build

# Run tests (when available)
npm test

# Lint code (when available)
npm run lint
```

### 5. Commit Changes

```bash
# Stage changes
git add .

# Commit with conventional message
git commit -m "feat(backend): add new feature"

# Multiple commits are fine - they'll be squashed on merge
```

### 6. Push to Fork

```bash
git push origin feat/your-feature-name
```

### 7. Create Pull Request

1. Go to GitHub
2. Click "New Pull Request"
3. Select your branch
4. Fill in the PR template

---

## 🔀 Pull Request Process

### PR Title Format

Use the same format as commit messages:

```
feat(scope): brief description
fix(scope): brief description
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (PATCH)
- [ ] New feature (MINOR)
- [ ] Breaking change (MAJOR)
- [ ] Documentation update

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
Describe how you tested the changes

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows project style
- [ ] Self-reviewed my code
- [ ] Commented complex code
- [ ] Updated documentation
- [ ] No new warnings
- [ ] Added tests (if applicable)
- [ ] All tests pass
```

### Review Process

1. **Automated checks** will run (CI/CD)
2. **Maintainer review** - may request changes
3. **Approval** - PR is approved
4. **Merge** - Squash and merge to main
5. **Auto-release** - Version bump and release created

---

## 🎨 Code Style

### General Guidelines

- **Follow existing patterns** in the codebase
- **Keep functions small** and focused
- **Use descriptive names** for variables and functions
- **Comment complex logic**
- **Avoid code duplication**

### JavaScript/React

```javascript
// Use arrow functions for components
const MyComponent = ({ prop1, prop2 }) => {
  // Component logic
  return <div>{prop1}</div>;
};

// Use destructuring
const { data, error } = useSWR(key, fetcher);

// Use template literals
const message = `Hello ${name}`;

// Prefer async/await over promises
const fetchData = async () => {
  try {
    const result = await api.getData();
    return result;
  } catch (error) {
    console.error(error);
  }
};
```

### File Naming

- **Components:** PascalCase (e.g., `LivePointsView.js`)
- **Utilities:** camelCase (e.g., `apiHelpers.js`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `API_CONFIG.js`)

### Imports

```javascript
// External imports first
import React, { useState } from 'react';
import useSWR from 'swr';

// Internal imports second
import { api } from '@/lib/api';
import Layout from '@/components/Layout';

// Styles last
import '@/styles/globals.css';
```

---

## 🧪 Testing

### Manual Testing

Before submitting a PR:

1. **Start the application:**
   ```bash
   docker-compose up --build
   ```

2. **Test the feature:**
   - Navigate to the relevant page
   - Test all user interactions
   - Check error states
   - Verify responsive design

3. **Check logs:**
   ```bash
   docker-compose logs -f backend
   docker-compose logs -f frontend
   ```

4. **Test in different browsers** (Chrome, Firefox, Safari)

### Automated Testing (Future)

When tests are added:

```bash
# Run all tests
npm test

# Run specific test file
npm test path/to/test.js

# Run with coverage
npm test -- --coverage
```

---

## 📚 Documentation

### When to Update Docs

Update documentation when:
- Adding new features
- Changing API endpoints
- Modifying configuration
- Adding new environment variables
- Changing deployment process

### Which Files to Update

- **README.md** - Overview and quick start
- **FEATURES.md** - Feature list
- **DEPLOYMENT.md** - Deployment instructions
- **CHANGELOG.md** - Will be auto-updated
- **API docs** - For endpoint changes

---

## 🐛 Reporting Bugs

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. macOS, Windows, Linux]
- Browser: [e.g. Chrome, Firefox]
- Version: [e.g. v2.0.0]

**Additional context**
Any other information about the problem.
```

---

## 💡 Suggesting Features

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
Describe the problem.

**Describe the solution**
What you want to happen.

**Describe alternatives**
Alternative solutions you've considered.

**Additional context**
Screenshots, mockups, etc.
```

---

## 📞 Questions?

- **Issues:** https://github.com/AndrewTtofi/fplcompanion/issues
- **Discussions:** https://github.com/AndrewTtofi/fplcompanion/discussions

---

## 🙏 Thank You!

Your contributions make this project better for everyone. Thank you for being part of the FPL Companion community!

---

## Quick Reference

### Commit Types
```bash
feat:      # New feature (MINOR bump)
fix:       # Bug fix (PATCH bump)
feat!:     # Breaking change (MAJOR bump)
chore:     # Maintenance (PATCH bump)
docs:      # Documentation (PATCH bump)
refactor:  # Code refactoring (PATCH bump)
perf:      # Performance (PATCH bump)
test:      # Testing (PATCH bump)
```

### Workflow
```bash
# 1. Create branch
git checkout -b feat/my-feature

# 2. Make changes
# ... edit files ...

# 3. Commit
git commit -m "feat: add my feature"

# 4. Push
git push origin feat/my-feature

# 5. Create PR on GitHub
```

### Version Bumps
- `feat!:` or `BREAKING CHANGE:` → **v2.0.0** (MAJOR)
- `feat:` → **v1.1.0** (MINOR)
- `fix:`, `chore:`, etc. → **v1.0.1** (PATCH)
