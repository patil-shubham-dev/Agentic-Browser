# Product Requirements Document: Agentic Browser

**Document status:** Draft v1.0
**Owner:** Shubham
**Platform:** Desktop only — Windows, macOS, Linux
**Runtime:** Electron (Chromium-based, native app — not a browser extension)
**Document type:** Standalone product PRD (this product is built, tested, and hardened independently before any downstream integration)

---

## 1. Product Vision

Agentic Browser is a desktop application that gives an AI agent its own real browser — one it can see, read, and operate the way a human would, with a visible, permissioned, human-supervisable interface. It is not a scraping tool and not a headless automation script wrapped in a UI. It is a full Chromium-based browser, built Electron-native, whose control surface (DOM state, accessibility tree, screenshots, console, network) is exposed to an LLM-driven agent runtime, while a human retains real-time visibility and override at every step.

The product target is functional and visual parity with the best agentic browser experiences currently on the market (OpenAI Codex's in-app browser + Chrome extension, Google Antigravity's browser automation surface), executed with premium visual craft (Apple / Notion / Linear-level polish) rather than a developer-tool aesthetic bolted onto stock Chromium chrome.

## 2. Problem Statement

Existing agentic browser capability is fragmented:
- Extension-based agents (Codex for Chrome, browser-use extensions) depend on a third-party browser (Chrome), inherit its update cycle, and are constrained by the extension permission model.
- Headless automation frameworks (pure Playwright/Puppeteer scripts) have no persistent UI, no human-in-the-loop review surface, and are unusable for a non-technical or supervising user.
- No available desktop product combines: a fully owned Chromium shell, structured page understanding (DOM + accessibility tree, not just pixels), a permission/consent system per site, a human annotation/collaboration layer, and premium native UI — all as one deployable Electron binary.

Agentic Browser fills this gap as a standalone product.

## 3. Goals and Non-Goals

### 3.1 Goals
- Ship a working, installable Electron desktop app that renders web pages with full Chromium fidelity.
- Give an LLM agent structured, reliable control of the browser: navigation, DOM read/write, form interaction, screenshotting, console/network introspection.
- Provide a permission and consent system so no site is touched without explicit or previously-granted authorization.
- Provide a human collaboration layer: live view of agent actions, annotation-driven feedback, pause/resume/takeover.
- Support multiple concurrent agent-controlled tabs, each independently scoped.
- Reach visual and interaction quality comparable to Codex's in-app browser and Chrome extension, without depending on Chrome itself.

### 3.2 Non-Goals (explicitly out of scope for v1)
- Mobile, tablet, or web-hosted versions.
- Being a general-purpose daily-driver browser replacement (no bookmarks sync, no extension marketplace, no password manager suite) — those are future considerations, not v1 requirements.
- Full OS-level "computer use" outside the browser window (system-wide mouse/keyboard control of arbitrary apps) — only the fallback input-simulation described in section 8.7, scoped to the browser's own window and file dialogs it triggers.
- Multi-user cloud sync, team collaboration, or hosted/cloud execution of agent sessions. This is a local, single-user desktop product for v1.
- Building a custom LLM. The product is model-agnostic at the orchestration layer; it exposes tool-call-compatible actions and consumes an existing LLM API.

## 4. Target User

A developer or power user who wants an AI agent to autonomously operate real web pages — testing a local dev server, filling forms, researching across tabs, verifying a UI fix, monitoring a dashboard — while staying able to watch, correct, and approve what the agent does, on their own machine, without sending browser state to a third-party extension store or losing control of the browser process.

## 5. Platform and Technical Constraints

- **Desktop only.** No responsive/mobile layout requirement. UI is designed for windowed desktop use (min width 1024px, target 1440–1920px).
- **Electron native.** The application shell, main process, and renderer are Electron. No web-hosted fallback.
- **Chromium engine ownership.** The app embeds and controls its own Chromium instance via Electron's `BrowserWindow`/`WebContentsView` and the Chrome DevTools Protocol (CDP) — it does not depend on the user's separately installed Chrome/Edge/Firefox.
- **Process model.** Multi-process: Electron main process (window/lifecycle/OS integration), renderer processes per tab (Chromium sandboxed), a dedicated agent-orchestration process (Node.js, isolated from renderer for security), and a permission/policy process holding the allow/block list and consent state.
- **No remote code execution surface.** The agent's JavaScript execution capability is restricted to read-only inspection by default (see 8.4); write-capable script execution requires explicit per-action user approval unless the user has enabled autonomous mode for that session.
- **Local-first.** All session data, permission lists, and recordings are stored locally (SQLite/local file store). No mandatory cloud dependency for core functionality.

## 6. High-Level Architecture

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

**Key architectural principle:** the agent never controls the browser directly through raw OS input by default. It issues structured actions (`click(elementRef)`, `type(elementRef, text)`, `navigate(url)`, `screenshot()`, `readDOM()`) against a page-sensing abstraction layer built on CDP. This keeps actions auditable, replayable, and reversible, and is what allows the annotation/review UI in section 8.5 to function.

## 7. Detailed Feature Requirements

Each feature below includes: description, functional requirements, and acceptance criteria.

### 7.1 Core Browsing Engine

**Description:** The foundational Chromium-based multi-tab browser shell.

**Functional requirements:**
- FR-1.1: Render arbitrary web pages with full Chromium engine fidelity (HTML5, CSS3, WebGL, video/audio, WASM).
- FR-1.2: Multi-tab support with tab creation, closing, reordering, pinning, and duplication.
- FR-1.3: Multi-window support (separate OS-level windows, each with its own tab set).
- FR-1.4: Persistent default profile: cookies, localStorage, IndexedDB, and session storage persist across app restarts.
- FR-1.5: Ephemeral "agent session" profile mode: an isolated, disposable browsing context (separate cookie jar) that agents can be assigned to when the user does not want the agent touching logged-in state.
- FR-1.6: Address bar with autocomplete from local history; back/forward/reload/stop native controls.
- FR-1.7: Downloads manager with file-type awareness and save-location control.
- FR-1.8: Find-in-page, zoom control, print-to-PDF.

**Acceptance criteria:**
- App renders modern SPA sites (React/Vue/Next.js dev servers) identically to current-generation Chrome, verified against a fixed test-site checklist.
- Cookie/session state survives an app restart in default profile; does not persist in ephemeral agent profile.
- Opening 20 tabs does not cause renderer crash or >2s input lag on target reference hardware (defined in section 10).

### 7.2 Page Sensing Layer (Agent's "Eyes")

**Description:** The structured representation of a page's state that the agent consumes instead of raw pixels alone.

**Functional requirements:**
- FR-2.1: DOM snapshot extraction: serializable tree of visible, interactable elements with tag, role, text content, bounding box, and a stable reference ID.
- FR-2.2: Accessibility tree extraction via Chromium's accessibility API, mapped to the same reference IDs as the DOM snapshot, so the agent can reason using semantic roles (button, link, textbox, checkbox) rather than raw CSS selectors.
- FR-2.3: Screenshot capture: full-page, current-viewport, and single-element (cropped to bounding box), all as PNG with configurable scale.
- FR-2.4: Console log stream capture (log/warn/error/info) per tab, queryable by the agent and surfaced to the sidebar.
- FR-2.5: Network request/response log (method, URL, status, timing, headers — bodies excluded by default for privacy, opt-in to include).
- FR-2.6: Page-state diffing: given two DOM snapshots, compute a structured diff (added/removed/changed elements) for verification workflows ("did the button's label change after my fix").
- FR-2.7: Element reference IDs must remain stable across a single navigation/interaction sequence so the agent can issue a `readDOM()` then `click(refId)` without a race condition from DOM mutation.

**Acceptance criteria:**
- Given a rendered page, `readDOM()` returns all interactable elements with correct bounding boxes, verified against manual inspection on 10 representative sites (form-heavy, SPA, static content, dashboard/canvas-heavy).
- Screenshot capture completes in under 500ms for a full HD viewport on reference hardware.
- Console/network logs correctly attribute to the originating tab when multiple tabs are active simultaneously.

### 7.3 Agent Action Layer (Agent's "Hands")

**Description:** The set of structured, tool-call-compatible actions the LLM orchestrator can invoke against a page.

**Functional requirements:**
- FR-3.1: `navigate(url)` — load a URL in a target tab.
- FR-3.2: `click(elementRef)`, `doubleClick(elementRef)`, `rightClick(elementRef)`.
- FR-3.3: `type(elementRef, text, {clear: bool})` — focus element and input text, respecting native input events (not just value assignment, so React/Vue controlled inputs update correctly).
- FR-3.4: `scroll(elementRef | page, direction, amount)`.
- FR-3.5: `hover(elementRef)`, `dragAndDrop(sourceRef, targetRef)`.
- FR-3.6: `selectOption(elementRef, value)` for `<select>` and ARIA listbox patterns.
- FR-3.7: `uploadFile(elementRef, filePath)` — programmatic file input handling without relying on OS file-picker automation where avoidable.
- FR-3.8: `pressKey(key, modifiers)` for keyboard shortcuts.
- FR-3.9: `executeReadOnlyScript(js)` — sandboxed, read-only JS evaluation (no DOM mutation permitted; enforced by static analysis + a restricted execution context) for state inspection.
- FR-3.10: `executeScript(js)` — full JS execution, gated behind explicit per-call user approval unless autonomous mode is enabled for the session.
- FR-3.11: Every action returns a structured result (success/failure, resulting DOM diff, screenshot) so the agent can self-verify without a separate `readDOM()` call.
- FR-3.12: Action queue with cancellation: the user can interrupt an in-progress action sequence at any point (see 7.5).

**Acceptance criteria:**
- `type()` correctly triggers `input`/`change` events recognized by React/Vue/Angular controlled components, verified against test forms built in each framework.
- `executeReadOnlyScript` cannot mutate DOM state or set global variables — verified by an automated test suite of mutation attempts that must all be rejected.
- All actions log a timestamped, replayable entry to the session log (section 7.8).

### 7.4 Permission and Consent System

**Description:** Governs what the agent is allowed to touch, and when the human must be asked.

**Functional requirements:**
- FR-4.1: Per-domain allow/block list, persisted locally, editable from settings.
- FR-4.2: First-contact prompt: on the agent's first attempt to navigate to or act on a new domain within a session, the user is prompted to allow-once, allow-always, deny-once, or block-always.
- FR-4.3: Removing a domain from the allow list reverts it to prompt-again state; removing from block list reverts it to prompt-again state (matches expected behavior from comparable products — never silently re-block or re-allow without notice).
- FR-4.4: Session mode toggle: "Ask before every action" vs. "Autonomous within allowed domains" — the latter still respects the domain allow/block list but does not prompt per click/type action.
- FR-4.5: Sensitive-action gate: regardless of session mode, actions classified as sensitive (payment form submission, password field entry, file download to disk, `executeScript` with write capability) always require explicit per-action confirmation, non-configurable in v1.
- FR-4.6: Visible, persistent on-screen indicator whenever an agent is actively controlling a tab (colored border or badge on the tab), so the user always knows which tab is under agent control versus manual control.
- FR-4.7: One-click "take over" control that immediately halts the agent's action queue and returns the tab to manual human control.

**Acceptance criteria:**
- No network navigation or DOM action occurs on a domain not present in the allow list without triggering the first-contact prompt.
- Sensitive-action gate cannot be disabled through any settings path in v1.
- Take-over control halts an in-flight action sequence within one action step (no queued actions execute after take-over is triggered).

### 7.5 Human Collaboration Layer

**Description:** The surface that lets a human supervise, guide, and correct the agent in real time — this is the primary UX differentiator versus a headless automation tool.

**Functional requirements:**
- FR-5.1: Live view: the tab the agent is operating renders normally in the window; the user watches actions happen in real time (cursor movement indicator, highlighted element being acted on).
- FR-5.2: Task sidebar showing: current plan/step list, action history for the current session, sources/URLs visited, and any generated artifacts (screenshots, downloaded files, extracted data).
- FR-5.3: Annotation mode: user can enter an annotation state, click-drag to select a page region or click a single element, and attach a free-text comment describing the desired change or issue.
- FR-5.4: Structured annotation feedback: when an element is selected in annotation mode, an inline panel allows the user to specify concrete attributes (spacing, color, text) that get attached to the comment as structured metadata alongside the free text, giving the agent a more precise target.
- FR-5.5: Comment resolution flow: after annotations are submitted, the user sends a follow-up instruction and the agent's session picks up the pending annotations as part of its task context.
- FR-5.6: Pause/resume: user can pause the agent mid-task without fully taking over; agent halts after completing its current in-flight action and waits.
- FR-5.7: Post-task summary: on task completion, a generated summary (what was done, screenshots before/after, elements changed) is shown in the sidebar and stored in session history.

**Acceptance criteria:**
- Annotation comments are correctly associated with the specific DOM element reference at time of annotation, and remain resolvable even if the agent re-fetches the DOM afterward (using stable selectors, not just coordinates).
- Pause takes effect within one action step; resume continues the original plan without requiring task restatement.
- Post-task summary generation completes within 5 seconds of task completion for a session with under 50 actions.

### 7.6 Multi-Agent / Multi-Tab Orchestration

**Description:** Support for more than one agent-controlled tab operating concurrently.

**Functional requirements:**
- FR-6.1: Each agent-controlled tab operates as an independently scoped session with its own action queue, permission context, and task sidebar entry.
- FR-6.2: A global "agent activity" panel lists all currently active agent sessions across tabs/windows, with status (running, paused, waiting-for-approval, completed, failed).
- FR-6.3: Resource governance: a configurable maximum number of concurrent agent-controlled tabs (default cap, user-adjustable) to prevent runaway resource consumption.
- FR-6.4: Cross-tab task coordination is out of scope for v1 (each agent tab operates independently; no shared planning state between tabs in v1). This is a deliberate scope cut, listed here so it is not silently missed.

**Acceptance criteria:**
- Running 3 concurrent agent-controlled tabs on reference hardware maintains per-tab action latency within 20% of single-tab baseline.
- Global activity panel correctly reflects real-time status transitions for all active sessions.

### 7.7 Scheduled and Background Automation

**Description:** Ability to run agent tasks on a schedule or trigger, without an active user session.

**Functional requirements:**
- FR-7.1: Local task scheduler: define a recurring task (e.g., "check this dashboard every hour") with a natural-language task description and a target URL/domain scope.
- FR-7.2: Scheduled tasks respect the same permission/domain allow-list system as interactive sessions — no bypass for background execution.
- FR-7.3: Background task results (summary, screenshots, extracted data) are stored and surfaced in a notification/history view on next app foreground.
- FR-7.4: Background tasks run in a minimized/backgrounded window state rather than a fully hidden headless process, preserving the "always visible, never covert" principle from section 4.6.

**Acceptance criteria:**
- Scheduled task fires within 1 minute of its configured time on an app instance running in the background.
- No scheduled task executes on a domain absent from the allow list; it fails closed with a logged reason instead.

### 7.8 Session Recording and Macro Replay

**Description:** Record a manual browsing flow once, replay it via the agent later.

**Functional requirements:**
- FR-8.1: Manual recording mode: while active, every user click/type/navigation is captured as a structured action sequence (same schema as agent actions in 7.3), not merely a video.
- FR-8.2: Recorded sequences are editable (reorder, delete, add wait/assert steps) before being saved as a named macro.
- FR-8.3: Macro replay can be invoked directly (deterministic replay) or handed to the agent as a reference flow to adapt if the page has changed since recording (agent-assisted replay).
- FR-8.4: All agent action execution (interactive or replayed) is logged to a session log capable of being exported and used for deterministic replay/debugging.

**Acceptance criteria:**
- A recorded macro of 15+ steps replays successfully against the same page state with 100% step success rate in deterministic mode.
- Agent-assisted replay against a modified page (element moved/renamed) succeeds by re-resolving via the accessibility tree rather than failing on stale selectors, for at least simple structural changes (element reordering, class name changes) — full semantic redesign resilience is a stretch goal, not a v1 guarantee.

### 7.9 Developer Tooling Integration

**Description:** Features aimed at using the browser to verify and debug web application code, since this is a primary expected use case.

**Functional requirements:**
- FR-9.1: Direct CDP-based DevTools panel embedded in-app (Elements, Console, Network, Sources) available for manual use alongside agent use.
- FR-9.2: "Point at local dev server" quick-connect: a shortcut to open and monitor `localhost` ports commonly used by dev servers (3000, 5173, 8080, etc.), auto-detected where possible.
- FR-9.3: Visual regression helper: given a baseline screenshot and a current screenshot of the same element/page, produce a pixel-diff overlay and a structured description of what changed.
- FR-9.4: Error surfacing: uncaught JS errors and failed network requests on an agent-monitored tab are automatically included in the agent's context for the current task without requiring a manual console check.

**Acceptance criteria:**
- DevTools panel functionally matches Chrome DevTools for Elements/Console/Network tabs on core operations (inspect element, view request headers, view console output).
- Visual regression diff correctly flags a deliberately introduced 5px layout shift in a test page.

### 7.10 Device-Level Fallback Control (Browser-Scoped)

**Description:** Limited OS-level input simulation for cases the DOM/CDP layer cannot handle — native file dialogs, canvas-rendered UI, PDF viewers embedded in the page.

**Functional requirements:**
- FR-10.1: OS-level mouse/keyboard simulation, scoped strictly to the Agentic Browser's own window and any native dialogs it spawns (e.g., the OS file picker triggered by an upload button).
- FR-10.2: Clipboard read/write, gated behind the same sensitive-action confirmation as FR-4.5.
- FR-10.3: This capability is explicitly not a general OS automation surface — it must not be exposed as a tool capable of controlling other applications' windows in v1.

**Acceptance criteria:**
- Fallback input simulation successfully completes a native file-upload dialog flow (select file, confirm) end to end.
- No fallback action is demonstrable against a window outside the Agentic Browser process in security testing.

### 7.11 Visual and Interaction Design

**Description:** The application must read as a premium, purpose-built product, not a generic Electron/Chromium shell.

**Functional requirements:**
- FR-11.1: Fully custom title bar, tab strip, and address bar — no default OS/Chromium chrome.
- FR-11.2: Dark-first theme with a defined design token system (color, spacing, typography scale) rather than ad hoc styling; a light theme is a v1.1 consideration, not a v1 blocker.
- FR-11.3: Distinct, deliberate visual treatment for: agent-controlled state (active border/glow on the controlled tab), permission prompts (non-jarring, inline rather than OS-native alert dialogs where possible), and annotation mode (clear visual mode-switch cue).
- FR-11.4: Motion/microinteraction pass on state transitions (tab open/close, agent action start/stop, panel expand/collapse) — subtle, purposeful, not decorative.
- FR-11.5: All custom UI components (buttons, inputs, panels, prompts) built from a defined component set, not mixed ad hoc styling across features.

**Acceptance criteria:**
- No default Electron/Chromium native chrome (default title bar, default alert()/confirm() dialogs) visible anywhere in the shipped app.
- Design review checklist (component consistency, spacing grid adherence, motion timing) passes before v1 release sign-off.

## 8. Non-Functional Requirements

### 8.1 Performance
- Cold app start under 3 seconds on reference hardware.
- New tab creation under 500ms.
- Agent action-to-result round trip (excluding LLM inference time) under 300ms for DOM-layer actions.
- Memory footprint: base app under 400MB with one tab open; must not exceed linear-ish growth per additional tab beyond Chromium's inherent per-process overhead.

### 8.2 Security
- Renderer processes remain sandboxed per Electron/Chromium security defaults; `nodeIntegration` disabled in all web-content-facing renderers; `contextIsolation` enabled.
- Agent orchestration process has no direct filesystem write access outside a designated app-data directory except through explicit, user-approved download/upload actions.
- All inter-process communication (main ↔ renderer ↔ agent orchestrator) uses a validated, typed IPC schema — no arbitrary string-eval bridges.
- `executeScript` (write-capable JS execution) is logged in full, including the script body, in the session log for auditability.
- No telemetry of page content leaves the device by default; any future opt-in cloud feature must be a separate, explicit setting.

### 8.3 Privacy
- Ephemeral agent profile (7.1, FR-1.5) leaves no persistent trace after session end unless the user explicitly saves it.
- Network request bodies are excluded from logs by default (FR-2.5); credentials are never logged in plaintext under any configuration.
- Local data store is the default and only mode for v1 — no cloud sync exists to leak data through.

### 8.4 Reliability
- Agent action failures fail closed (halt and report) rather than retrying silently in a loop; a configurable max-retry count (default 2) applies per action.
- Crash recovery: a renderer crash in one tab must not take down the main process or other tabs' agent sessions.

### 8.5 Accessibility (of the app itself, not just the sensing layer)
- Core app UI (not agent-controlled page content) meets WCAG 2.1 AA for keyboard navigation and screen reader labeling on primary controls (tab bar, address bar, permission prompts, sidebar).

## 9. Success Metrics (v1 exit criteria)

- Agent can complete a defined benchmark task set (form fill, multi-step checkout on a test site, dashboard data extraction, local dev server visual verification) with no less than 90% task success rate without human takeover, on the reference test-site suite.
- Zero critical security findings (sandbox escape, unauthorized cross-domain action, credential leakage) in a pre-release security review.
- App passes a full manual QA pass on Windows, macOS, and Linux with no P0/P1 defects open.
- Visual/UX review sign-off against the design token system with no unresolved inconsistencies.

## 10. Reference Hardware Baseline

Performance and concurrency targets in this document (7.6, 8.1) are measured against: 8-core CPU, 16GB RAM, SSD storage, mid-range integrated or discrete GPU — representative of a typical modern developer laptop, not a high-end workstation.

## 11. Phased Delivery Plan

**Phase 1 — Core shell and sensing (foundation)**
Sections 7.1, 7.2, 7.3 (core actions only), 7.4 (basic allow/block + first-contact prompt), 7.11 (base visual system). Goal: a working browser an agent can reliably see and act on, manually driven via a debug console before any orchestration UI exists.

**Phase 2 — Human collaboration layer**
Sections 7.5, 7.4 (full sensitive-action gating, session modes), developer tooling basics (7.9 FR-9.1, FR-9.4). Goal: a human can watch, annotate, pause, and take over.

**Phase 3 — Orchestration and automation**
Sections 7.6, 7.7, 7.8. Goal: multi-tab agents, scheduling, and macro recording/replay.

**Phase 4 — Polish and hardening**
Full section 7.11 visual pass, section 7.9 visual regression tooling, section 7.10 fallback input, full security review against section 8.2, performance tuning against section 8.1.

Each phase should reach a demonstrable, testable state before the next begins; phases are not required to be time-boxed equally.

## 12. Open-Source Component Analysis

Principle for this entire section: use an existing library only where it is genuinely best-in-class for a narrow, well-defined layer of the stack, and where depending on it does not constrain the visual/UX quality bar in section 7.11 or the architectural control needed for sections 7.3–7.5. Do not adopt a library that dictates UI, since the UI must be fully custom. Prefer libraries that operate at the protocol/data layer (CDP control, DOM diffing, recording format) over libraries that ship their own UI or opinionated app structure.

### 12.1 App shell and packaging
- **Electron** (`electron/electron`) — Required foundation, not optional. Mature, most actively maintained cross-platform native shell for exactly this use case. High quality, no concerns.
- **electron-builder** (`electron-userland/electron-builder`) — Packaging/auto-update for Windows/macOS/Linux installers. High quality, widely used in production Electron apps; safe to depend on directly for build tooling (build-time dependency, zero runtime UI/behavior risk).
- **electron-vite** — Fast dev/build tooling for Electron + modern frontend bundling. Safe as a build-time dependency.

### 12.2 Browser control / CDP layer
- **`puppeteer-core`** (Google/Puppeteer team) — Mature, well-maintained CDP client library. Use only the CDP-session/protocol-driver portions (element interaction primitives, screenshot capture, network domain) as an internal implementation detail of the Page Sensing/Action layers (7.2, 7.3) — do not expose Puppeteer's own API surface or test-runner conventions to the agent layer; wrap it behind your own action schema (FR-3.1–FR-3.12) so the agent-facing contract stays product-owned.
- **`playwright-core`** — Alternative to puppeteer-core with arguably stronger accessibility-tree extraction and auto-waiting semantics, relevant to FR-2.2 and FR-3.11. Evaluate both against your actual Electron/CDP integration (Playwright is primarily designed to drive an external browser process, not to be embedded inside the same Electron app it ships with — this needs a spike before committing, since Playwright's Electron support is intended for testing Electron apps, not for being the in-app control layer of one). Puppeteer-core has more precedent for in-app CDP embedding; treat it as the safer default unless the Playwright spike proves otherwise.
- **Do not** adopt higher-level "agent browser" frameworks (e.g., `browser-use`, `Stagehand`) as direct runtime dependencies for the core action layer. These are good references for the DOM-to-agent grounding *approach* (element indexing, accessibility-tree-to-LLM formatting) and worth reading for design inspiration, but embedding them directly would import their own UI/CLI assumptions, their own LLM prompt scaffolding, and their own release cadence into your product's most sensitive control layer. Reimplement the specific technique (structured element referencing for LLM tool calls) natively so the schema in section 7.3 stays fully product-owned.

### 12.3 DOM/accessibility extraction
- **Chromium's native Accessibility Tree API** (via CDP `Accessibility` domain) — Use directly through the CDP layer above; this is the correct source of truth for FR-2.2, not a third-party library.
- **`axe-core`** (Deque Systems) — High-quality, widely trusted accessibility analysis engine. Useful as an optional add-on for surfacing accessibility issues on pages the agent visits (a nice-to-have signal for the agent, not a v1 requirement) — safe to include if this feature is prioritized.

### 12.4 Session recording / replay
- **`rrweb`** — High-quality, widely used DOM-mutation recording/replay library (used in production by companies like PostHog, LogRocket for session replay). Strong candidate for the underlying capture format in FR-8.1, since it already solves DOM-mutation-based (not pixel-video-based) recording robustly. Use its recording/serialization core; do not use its default player UI — build a custom replay/edit UI per section 7.11's visual requirements.

### 12.5 Screenshot diffing / visual regression
- **`pixelmatch`** (same author lineage as resemble.js, used by Playwright itself internally) — Small, fast, high-quality pixel-diff library. Good fit for FR-9.3's diff computation; does not impose any UI, so it fits the "protocol/data layer only" principle cleanly.
- **`odiff`** — Faster native alternative to pixelmatch for large-scale diffing if performance testing shows pixelmatch is a bottleneck at full-page-screenshot scale. Worth a benchmark during Phase 4, not a default choice.

### 12.6 Local data storage
- **`better-sqlite3`** — High-quality, synchronous, well-maintained SQLite binding for Node, well suited to Electron main-process use for session logs, permission store (FR-4.1), and macro storage (7.8). Preferred over heavier embedded-DB options given the local-first, single-user scope in section 8.3.

### 12.7 Explicitly avoid or use only as reference, not dependency
- Full "AI browser agent" open-source products (`browser-use`, `Stagehand`, `Skyvern`, similar) — read their source for grounding technique inspiration only, as noted in 12.2. Direct dependency risk: they bundle their own agent-loop/prompting assumptions that would fight with a product-owned orchestration layer (section 6), and none currently ship the Electron-native, visually custom shell this PRD requires — adopting one wholesale would anchor the product's UX to someone else's defaults, contradicting section 7.11.
- Any Chromium extension-based automation library (built for Chrome's `chrome.debugger`/extension APIs) — wrong integration model entirely for an Electron-native, non-extension product; CDP-over-Electron is the correct model, not the extension permission model these libraries assume.
- Generic "Electron UI kit" component libraries — must not be used for the primary chrome/tab UI, since section 7.11 requires a fully custom design system; acceptable at most for internal debug/settings screens that are not part of the primary product surface, if it meaningfully speeds internal tooling.

### 12.8 Summary table

| Layer | Recommended | Confidence | Integration risk |
|---|---|---|---|
| App shell | Electron | High | None — foundational |
| Packaging | electron-builder | High | Low — build-time only |
| CDP control | puppeteer-core (spike playwright-core) | Medium-High | Medium — needs embedding spike |
| Accessibility tree | Native CDP Accessibility domain | High | Low |
| A11y analysis (optional) | axe-core | High | Low |
| Session recording | rrweb (capture core only) | High | Low-Medium — custom UI required |
| Visual diff | pixelmatch (odiff if needed) | High | Low |
| Local storage | better-sqlite3 | High | Low |
| Full agent-browser frameworks | Reference only, do not depend | — | High if adopted directly |

## 13. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Embedding CDP control inside the same Electron app that also renders the target page creates architectural complexity (self-referential control loop) | High — could block Phase 1 | Time-box a technical spike at the very start of Phase 1 to validate `WebContentsView` + CDP session attachment before committing to the full action-layer API design |
| Agent takes an unintended action on a sensitive site (e.g., submits a payment) | High — trust/safety | Sensitive-action gate (FR-4.5) is non-configurable; extend the sensitive-action classifier list based on Phase 2 testing before any public-facing release |
| Structured element references (FR-2.7) become stale mid-task on highly dynamic pages, causing action failures | Medium — reliability | Re-resolve references via accessibility role + nearby text similarity as a fallback before failing an action outright; log all fallback resolutions for review |
| Visual quality bar (7.11) slips under feature-delivery pressure | Medium — product differentiation | Design review gate at the end of every phase, not only at v1 exit |
| Performance degrades with multiple concurrent agent tabs (7.6) | Medium — usability | Enforce the configurable concurrency cap (FR-6.3) with a sensible default from day one rather than uncapping and tuning later |

## 14. Glossary

- **CDP** — Chrome DevTools Protocol; the low-level protocol used to instrument and control a Chromium renderer.
- **Accessibility tree** — A semantic representation of a page's UI (roles, labels, states) independent of raw DOM/CSS structure, used by screen readers and, here, by the agent for robust element targeting.
- **Element reference (elementRef)** — A stable identifier assigned to a page element for the duration of an action sequence, used by the agent to target actions without relying on brittle CSS selectors.
- **Sensitive action** — Any action classified as high-consequence (payment, password entry, file download, write-capable script execution) that always requires explicit per-action human approval.
- **Autonomous mode** — A session setting where the agent executes actions within already-allowed domains without per-action prompts, subject to the always-on sensitive-action gate.
- **Ephemeral agent profile** — A disposable browsing context with no persisted cookies/storage, used to isolate agent sessions from the user's logged-in state.
