# Contributing to Agentic Browser

Thank you for your interest in contributing to Agentic Browser! We welcome contributions from everyone. This document outlines the guidelines for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Architecture](#project-architecture)
- [Coding Standards](#coding-standards)
- [Pull Request Process](#pull-request-process)
- [Commit Conventions](#commit-conventions)
- [Testing Guidelines](#testing-guidelines)
- [Issue Reporting](#issue-reporting)
- [Feature Requests](#feature-requests)
- [Documentation](#documentation)
- [Questions & Discussions](#questions--discussions)

---

## Code of Conduct

This project follows a [Code of Conduct](CODE_OF_CONDUCT.md) that expects all contributors to treat others with respect and professionalism. By participating, you agree to uphold these standards.

---

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/agentic-browser.git
   cd agentic-browser
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/original-owner/agentic-browser.git
   ```
4. Create a feature branch:
   ```bash
   git checkout -b feat/your-feature-name
   ```

---

## Development Setup

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Git**

### Install Dependencies

```bash
npm install
npm run postinstall  # Build native modules
```

### Development Commands

```bash
npm run dev          # Start dev server with HMR
npm run build        # Production build
npm run preview      # Preview production build
npm run build:win    # Build Windows installer
npm run build:mac    # Build macOS installer
npm run build:linux  # Build Linux installer
```

### Environment

The project uses Electron's standard environment variables:

- `ELECTRON_RENDERER_URL` — Set automatically in dev mode to load from Vite dev server
- `NODE_ENV` — `development` or `production`

---

## Project Architecture

```
src/
├── main/           # Electron main process (Node.js)
│   ├── ipc/        # IPC handler definitions (typed schema)
│   ├── windows/    # Window/tab lifecycle management
│   └── services/   # SQLite-backed data stores
├── preload/        # Context bridge (security layer)
├── renderer/       # Frontend UI (React + Vite)
│   └── src/
│       ├── components/     # React components
│       ├── design-system/  # Reusable UI primitives
│       └── styles/         # Global CSS
├── agent/          # Agent orchestrator (isolated process)
│   ├── page-sensing/  # DOM/a11y/screenshot extraction
│   ├── actions/       # Action executor implementations
│   └── permissions/   # Permission management
└── shared/         # Shared types, constants, design tokens
```

### Key Architectural Principles

1. **Process isolation** — Main, renderer, and agent processes communicate only through typed IPC
2. **No direct OS input** — Agent actions are structured, auditable, and reversible
3. **Local-first** — All data stored locally; no cloud dependency
4. **Security by design** — `contextIsolation`, `nodeIntegration: false`, CSP enforced

---

## Coding Standards

### TypeScript

- **Strict mode** enabled — no `any` unless absolutely necessary and documented
- Use TypeScript interfaces/types for all data structures
- Prefer `interface` over `type` for object shapes; use `type` for unions/intersections
- All function parameters and return types must be explicitly annotated

### Naming Conventions

| Category | Convention | Example |
|---|---|---|
| Files | kebab-case | `address-bar.tsx` |
| React Components | PascalCase | `AddressBar.tsx` |
| Functions/Methods | camelCase | `createTab()` |
| Interfaces | PascalCase | `TabInfo` |
| Types | PascalCase | `AgentActionType` |
| Constants | UPPER_SNAKE_CASE | `IPC_CHANNELS` |
| CSS Classes | kebab-case | `.tab-strip` |
| CSS Variables | kebab-case | `--titlebar-height` |

### React Guidelines

- Functional components with hooks only (no class components)
- Use `useCallback`/`useMemo` for performance-sensitive computations
- Keep components focused — extract reusable logic into custom hooks
- Prefer composition over inheritance

### CSS/Styling

- Use CSS custom properties from the design token system (defined in `global.css`)
- No CSS-in-JS solutions — use inline styles or CSS modules
- Follow the spacing grid (4px base unit)
- Respect the dark-first theme

### Code Formatting

- **Indentation:** 2 spaces
- **Quotes:** Single quotes for JS/TS, double quotes for JSX attributes
- **Semicolons:** Required
- **Trailing commas:** ES5 compatible (trailing commas on multiline)

The project does not currently enforce a formatter, but consistency is appreciated.

---

## Pull Request Process

### PR Checklist

Before submitting a PR, ensure:

- [ ] Code builds without errors (`npm run build`)
- [ ] No TypeScript errors
- [ ] Follows coding standards and conventions
- [ ] New features include documentation (JSDoc for functions, updates to README if applicable)
- [ ] Changes are scoped to a single feature/bugfix
- [ ] Commit messages follow convention (see below)
- [ ] Branch is rebased on latest `main`
- [ ] PR description clearly explains the changes

### PR Title Convention

Use conventional commit format for PR titles:

```
feat: add support for multi-tab agent sessions
fix: resolve race condition in DOM snapshot extraction
docs: update API documentation for permission system
refactor: simplify action executor dispatch logic
chore: update electron-vite to v5
```

### Review Process

1. **Open a draft PR** early for feedback on approach
2. **At least one maintainer** must review and approve
3. **Address all review comments** before merge
4. **Squash commits** on merge (maintainer will handle this)

---

## Commit Conventions

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | Usage |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code style changes (formatting, etc.) |
| `refactor` | Code refactoring |
| `perf` | Performance improvements |
| `test` | Adding/updating tests |
| `chore` | Build, CI, dependencies |
| `security` | Security fixes |

### Examples

```
feat(agent): add console log streaming for agent context
fix(sidebar): resolve overflow in action history list
docs(readme): add quick-start guide for new users
refactor(ipc): switch to typed message validation
```

---

## Testing Guidelines

Testing infrastructure is planned for Phase 2. Until then:

- Manually verify changes by running the app (`npm run dev`)
- Test multi-tab scenarios thoroughly
- Verify that agent actions work correctly across different page types (SPA, static, form-heavy)
- Check that the permission system correctly blocks/allows domain access

When writing tests (once the framework is in place):

- Unit tests for utility functions and services
- Integration tests for IPC handlers
- E2E tests for critical user flows

---

## Issue Reporting

### Bug Reports

Use the [Bug Report template](.github/ISSUE_TEMPLATE/bug_report.md). Include:

- **Description** — Clear, concise description of the bug
- **Steps to reproduce** — Minimal reproduction steps
- **Expected behavior** — What should happen
- **Actual behavior** — What actually happens
- **Environment** — OS, Node version, app version
- **Screenshots** — If applicable
- **Logs** — Any relevant console output

### Feature Requests

Use the [Feature Request template](.github/ISSUE_TEMPLATE/feature_request.md). Include:

- **Problem** — What problem does this solve?
- **Solution** — Proposed solution or approach
- **Alternatives** — Alternatives you've considered
- **Priority** — How important is this to you?

---

## Documentation

- Update README.md for significant changes to the API, architecture, or setup
- Add JSDoc comments for new public functions and methods
- Document complex logic inline with comments
- Keep the PRD (`Agentic_Browser_PRD.md`) as the source of truth for feature requirements

---

## Questions & Discussions

- **GitHub Issues** — For bug reports and feature requests
- **GitHub Discussions** — For questions, ideas, and general discussion
- **Pull Requests** — For code contributions

---

## Recognition

Contributors will be acknowledged in the project's release notes and, if desired, in a CONTRIBUTORS.md file. Thank you for helping make Agentic Browser better!

---

*This document is adapted from our PRD and architecture docs. If you find something unclear or outdated, please open an issue or PR.*
