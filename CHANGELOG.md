# Changelog

All notable changes to the Agentic Browser project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Phase 1 — Foundation (In Progress)

#### Added

- **Core Browsing Engine** (PRD §7.1)
  - Chromium-based multi-tab browser shell with full rendering fidelity
  - Multi-window support — separate OS-level windows with independent tab sets
  - Persistent default profile with cookies/localStorage/IndexedDB
  - Ephemeral agent session profile mode for isolated browsing contexts
  - Custom frameless title bar with traffic light controls
  - Tab strip with create, close, reorder, and pinning support
  - Address bar with navigation controls (back, forward, reload, stop)
  - Find-in-page, zoom control, and print-to-PDF ready for integration

- **Custom Chrome UI** (PRD §7.11)
  - Fully custom title bar, tab strip, and address bar — no OS/Chromium chrome
  - Dark-first theme with comprehensive CSS custom property design token system
  - Agent-controlled visual state (green border glow, agent badge)
  - Collapsible sidebar with tabbed panels (actions, permissions, annotations, settings)
  - Design token specification: color, spacing, typography, radii, shadows, transitions
  - Shared component library: Button, Tooltip, Badge with multiple variants

- **Page Sensing Layer** (PRD §7.2)
  - DOM snapshot extraction — serializable tree of visible, interactable elements
  - Accessibility tree extraction via Chromium's accessibility API
  - Screenshot capture (full-page and viewport)
  - Console log stream capture (log/warn/error/info)
  - Network request/response logging (method, URL, status, timing)

- **Agent Action Layer** (PRD §7.3)
  - `navigate(url)` — load URL in target tab
  - `click(elementRef)` — click element with stable reference ID
  - `doubleClick(elementRef)` — double-click element
  - `rightClick(elementRef)` — right-click element
  - `type(elementRef, text)` — focus and type with native input events
  - `scroll(elementRef | page, direction, amount)` — smooth scroll
  - `hover(elementRef)` — trigger mouse enter/over events
  - `dragAndDrop(sourceRef, targetRef)` — drag and drop elements
  - `selectOption(elementRef, value)` — select from dropdowns
  - `pressKey(key, modifiers)` — keyboard shortcut dispatch
  - `executeReadOnlyScript(js)` — sandboxed read-only JS evaluation

- **Permission & Consent System** (PRD §7.4)
  - Per-domain allow/block list persisted via SQLite
  - First-contact prompt model for new domains
  - Session mode toggle framework (ask before every action / autonomous)
  - Sensitive-action gate design for payment, password, file download, script execution
  - One-click "take over" control
  - Agent status indicator with colored border and badge

- **Agent Orchestrator** (PRD §6 architecture)
  - Dedicated agent orchestrator process with session management
  - Action dispatch and routing with structured results
  - Permission checking before action execution
  - Session lifecycle management (start, pause, resume, end)

- **Session Recording & Logging** (PRD §7.8)
  - SQLite-backed session store
  - Per-action logging with structured params and results
  - Action status tracking (pending, running, success, failed, cancelled)
  - Session query and retrieval

- **Security** (PRD §8.2)
  - `contextIsolation: true` — renderer isolated from Node.js
  - `nodeIntegration: false` — no direct Node access in renderer
  - Content Security Policy enforced on all rendered pages
  - Typed IPC schema — no arbitrary string-eval bridges
  - Read-only script execution sandbox prevents DOM mutation

- **Project Infrastructure**
  - Electron + electron-vite + TypeScript + React project setup
  - electron-builder packaging for Windows, macOS, Linux
  - Development workflow with hot module replacement
  - Comprehensive TypeScript type definitions across all layers
  - Shared type system with 30+ interfaces and 28 IPC channel constants

### Technical Details

- **Runtime:** Electron (Chromium)
- **Language:** TypeScript (strict mode)
- **Frontend:** React 19
- **Build:** electron-vite with Vite
- **CDP Layer:** puppeteer-core
- **Local Storage:** better-sqlite3
- **Packaging:** electron-builder

---

## [0.1.0-alpha] — 2026-07-03

### Added

- Initial project scaffold
- Phase 1 foundation implementation
- All 29 source files across main, preload, renderer, agent, and shared layers
- Successful production build verified

[Unreleased]: https://github.com/your-org/agentic-browser/compare/v0.1.0-alpha...HEAD
[0.1.0-alpha]: https://github.com/your-org/agentic-browser/releases/tag/v0.1.0-alpha
