<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/assets/logo-dark.svg">
    <img alt="Agentic Browser" src="docs/assets/logo-light.svg" width="480">
  </picture>
</p>

<p align="center">
  <strong>A desktop AI agent browser — one it can see, read, and operate the way a human would, with a visible, permissioned, human-supervisable interface.</strong>
</p>

<p align="center">
  <a href="#"><img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue" alt="Platform"></a>
  <a href="#"><img src="https://img.shields.io/badge/runtime-Electron%20(Chromium)-47848F" alt="Runtime"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green" alt="License"></a>
  <a href="#"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs Welcome"></a>
  <a href="#"><img src="https://img.shields.io/badge/status-alpha-yellow" alt="Status"></a>
</p>

---

## Overview

Agentic Browser is a standalone desktop application that gives an AI agent its own real browser. It is:

- **Not a scraping tool.** Not a headless automation script wrapped in a UI.
- **A full Chromium-based browser**, built Electron-native, whose control surface (DOM state, accessibility tree, screenshots, console, network) is exposed to an LLM-driven agent runtime.
- **Human-supervisable by design.** A human retains real-time visibility, permission control, pause/resume, annotation, and one-click takeover at every step.

It targets functional and visual parity with the best agentic browser experiences (OpenAI Codex's in-app browser, Google Antigravity's browser automation surface), executed with premium visual craft rather than a developer-tool aesthetic.

> **Document status:** Alpha — Phase 1 (foundation) complete. See [Phase Delivery Plan](#-phase-delivery-plan).

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Phase Delivery Plan](#-phase-delivery-plan)
- [Tech Stack](#tech-stack)
- [Configuration](#configuration)
- [Security & Privacy](#security--privacy)
- [Contributing](#contributing)
- [License](#license)

---

## Features

### Core Browsing Engine
- Full Chromium-fidelity rendering (HTML5, CSS3, WebGL, WASM)
- Multi-tab support — create, close, reorder, duplicate
- Multi-window support — separate OS-level windows with independent tab sets
- Persistent profile with cookies/localStorage/IndexedDB
- Ephemeral "agent session" profile mode for isolated browsing contexts
- Native address bar with back/forward/reload/stop controls

### Page Sensing Layer ("Agent's Eyes")
- **DOM Snapshot Extraction** — serializable tree of visible, interactable elements with stable reference IDs
- **Accessibility Tree Extraction** — semantic roles (button, link, textbox) via Chromium's accessibility API
- **Screenshot Capture** — full-page, current-viewport, single-element
- **Console Log Streaming** — log/warn/error/info per tab
- **Network Request Logging** — method, URL, status, timing (bodies excluded by default for privacy)
- **Page-State Diffing** — structured diff between two DOM snapshots

### Agent Action Layer ("Agent's Hands")
Structured, tool-call-compatible actions the LLM can invoke:

| Action | Description |
|---|---|
| `navigate(url)` | Load a URL in a target tab |
| `click(elementRef)` | Click an element |
| `doubleClick(elementRef)` | Double-click an element |
| `rightClick(elementRef)` | Right-click an element |
| `type(elementRef, text)` | Focus and type text (native input events) |
| `scroll(elementRef, direction, amount)` | Scroll page or element |
| `hover(elementRef)` | Hover over an element |
| `dragAndDrop(sourceRef, targetRef)` | Drag and drop elements |
| `selectOption(elementRef, value)` | Select from dropdowns |
| `uploadFile(elementRef, path)` | Upload files programmatically |
| `pressKey(key, modifiers)` | Keyboard shortcuts |
| `executeReadOnlyScript(js)` | Sandboxed read-only JS evaluation |
| `executeScript(js)` | Full JS execution (gated behind approval) |

### Permission & Consent System
- Per-domain allow/block list (SQLite-backed)
- First-contact prompt on new domains
- Session mode toggle: "Ask before every action" vs. "Autonomous within allowed domains"
- **Sensitive-action gate** — payment forms, password fields, file downloads, `executeScript` always require explicit per-action confirmation (non-configurable in v1)
- Visible on-screen indicator when agent controls a tab (colored border + badge)
- One-click "take over" control

### Human Collaboration Layer (Phase 2)
- Live view of agent actions with cursor indicators
- Task sidebar with plan/step list and action history
- Annotation mode with element selection and structured feedback
- Pause/resume mid-task without losing context
- Post-task summary generation

### Developer Tooling
- Embedded DevTools panel (Elements, Console, Network, Sources)
- Local dev server quick-connect (`localhost:3000`, `5173`, `8080`, etc.)
- Visual regression helper (pixel-diff overlay)
- Automatic error surfacing for agent context

---

## Architecture

```
┌───────────────────────────────────────────────────────────┐
│  Electron Main Process                                     │
│  - Window/tab lifecycle, native menus, OS integration       │
│  - IPC broker between renderer, agent process, policy store │
└───────────────────────────────────────────────────────────┘
        │                    │                     │
        ▼                    ▼                     ▼
┌───────────────┐   ┌──────────────────┐   ┌──────────────────┐
│ Renderer(s)    │   │ Agent Orchestrator│   │ Permission/Policy │
│ (Chromium tabs,│◄──┤ (Node process,    │──►│ Store (SQLite)     │
│ CDP-instrumented)│   │ LLM tool-call loop,│   │ per-domain rules,  │
│               │   │ action executor)   │   │ session logs        │
└───────────────┘   └──────────────────┘   └──────────────────┘
        │                    │
        ▼                    ▼
┌───────────────┐   ┌──────────────────┐
│ Page Sensing   │   │ Human Collaboration│
│ Layer (DOM,    │   │ Layer (annotation, │
│ a11y tree,     │   │ live view, sidebar) │
│ screenshots,   │   │                     │
│ console/network)│   │                     │
└───────────────┘   └──────────────────┘
```

**Key principle:** The agent never controls the browser through raw OS input by default. It issues structured actions against a page-sensing abstraction layer built on CDP. This keeps actions auditable, replayable, and reversible.

### Process Model
- **Main process** — window/lifecycle/OS integration
- **Renderer processes** — Chromium sandboxed, one per tab
- **Agent orchestrator** — isolated Node.js process for LLM tool-call loop
- **Permission/Policy process** — holds allow/block list and consent state

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Git**

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/agentic-browser.git
cd agentic-browser

# Install dependencies
npm install

# Build native modules (better-sqlite3)
npm run postinstall
```

### Development

```bash
# Start development with hot reload
npm run dev

# Or build for production
npm run build

# Preview production build
npm run preview
```

### Build Installers

```bash
# Windows (NSIS installer)
npm run build:win

# macOS (DMG)
npm run build:mac

# Linux (AppImage)
npm run build:linux
```

---

## Usage

### Starting the Browser

```bash
npm run dev
```

This launches the Agentic Browser application with:
- Custom frameless title bar (dark theme)
- Tab strip with multi-tab support
- Address bar with navigation controls
- Collapsible agent session sidebar

### Running an Agent Task

1. Open a tab and navigate to a URL
2. Open the sidebar to view agent session state
3. The agent can be controlled programmatically via the agent orchestrator
4. Monitor actions in the sidebar's action history
5. Use pause/resume/take-over controls as needed

---

## Project Structure

```
agentic-browser/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── index.ts             # Application entry point
│   │   ├── ipc/                 # IPC handler definitions
│   │   ├── windows/             # Window and tab management
│   │   └── services/            # Backend services (SQLite stores)
│   ├── preload/                 # Preload scripts (context bridge)
│   ├── renderer/                # Frontend UI
│   │   └── src/
│   │       ├── components/      # React components
│   │       ├── design-system/   # Design system components
│   │       └── styles/          # Global styles
│   ├── agent/                   # Agent orchestrator
│   │   ├── page-sensing/        # DOM, a11y, screenshot extraction
│   │   ├── actions/             # Action executor implementations
│   │   └── permissions/         # Permission management
│   └── shared/                  # Shared types and constants
├── docs/                        # Documentation
├── resources/                   # App resources (icons, etc.)
├── package.json
├── electron.vite.config.ts
├── electron-builder.yml
└── tsconfig.json
```

---

## 🗺 Phase Delivery Plan

| Phase | Focus | Sections | Status |
|---|---|---|---|
| **1** | Core shell & sensing | 7.1, 7.2, 7.3, 7.4, 7.11 | ✅ Complete |
| **2** | Human collaboration | 7.5, 7.9 (basic) | 🔄 In Progress |
| **3** | Orchestration & automation | 7.6, 7.7, 7.8 | 📋 Planned |
| **4** | Polish & hardening | 7.11 (full), 7.9, 7.10, security | 📋 Planned |

See the full [Product Requirements Document](Agentic_Browser_PRD.md) for detailed specifications.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| App Shell | [Electron](https://www.electronjs.org/) | Cross-platform desktop runtime |
| Build Tooling | [electron-vite](https://electron-vite.org/) | Fast dev/build for Electron |
| Frontend | React 19 + TypeScript | UI rendering |
| CDP Control | [puppeteer-core](https://pptr.dev/) | Chrome DevTools Protocol client |
| Local Storage | [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) | SQLite for permissions/sessions |
| Screenshot Diff | [pixelmatch](https://github.com/mapbox/pixelmatch) | Visual regression (Phase 4) |
| Session Recording | [rrweb](https://www.rrweb.io/) | DOM mutation recording (Phase 3) |
| Packaging | [electron-builder](https://www.electron.build/) | Cross-platform installers |

---

## Configuration

### Development Configuration

The project uses `electron.vite.config.ts` for build configuration. Key paths:

```typescript
// Main process output: out/main/
// Preload script output: out/preload/
// Renderer output: out/renderer/
```

### Build Configuration

`electron-builder.yml` controls installer generation:

```yaml
appId: com.agentic-browser.app
productName: Agentic Browser
win:
  target: nsis
mac:
  target: dmg
linux:
  target: AppImage
```

---

## Security & Privacy

- **Renderer sandbox** — `nodeIntegration: false`, `contextIsolation: true`, sandbox enabled
- **No remote code execution** — `executeScript` requires explicit per-action approval
- **CSP enforced** — Content Security Policy on all rendered pages
- **Local-first** — All data stored locally (SQLite); no mandatory cloud dependency
- **Privacy by default** — Network request bodies excluded from logs; credentials never logged
- **Ephemeral profiles** — Isolated agent browsing contexts (separate cookie jar)
- **Audit trail** — Every agent action logged to replayable session log

---

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Bug Reports](.github/ISSUE_TEMPLATE/bug_report.md)
- [Feature Requests](.github/ISSUE_TEMPLATE/feature_request.md)

---

## License

[MIT](LICENSE) © Shubham

---

<p align="center">
  <sub>Built with ❤️ for developers who want AI agents they can trust.</sub>
</p>
