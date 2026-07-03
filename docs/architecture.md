# Architecture Overview

## High-Level Architecture

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

## Process Model

The application uses a multi-process architecture with strict isolation:

### Electron Main Process
- Window and tab lifecycle management
- Native OS integration (menus, dialogs, file system)
- IPC broker routing messages between all processes
- Service initialization (SQLite stores, profile management)

### Renderer Processes (per tab)
- Chromium sandboxed renderer
- No direct Node.js access (`nodeIntegration: false`)
- `contextIsolation: true` with typed preload bridge
- Communicates only via structured IPC messages

### Agent Orchestrator
- Isolated Node.js process
- LLM tool-call loop (model-agnostic — consumes existing LLM APIs)
- Action execution against page-sensing abstraction layer
- Permission checking before any action

### Permission/Policy Store
- SQLite-backed database
- Per-domain allow/block rules
- Session log storage
- Runs in main process for security

## Data Flow

### Agent Action Flow
1. LLM generates tool call (e.g., `click(refId)`)
2. Agent orchestrator receives action
3. Permission manager checks domain allow list
4. Action executor translates to CDP command
5. Page sensing layer captures result (DOM diff + screenshot)
6. Structured result returned to LLM
7. Action logged to session store

### Page Sensing Flow
1. Agent calls `readDOM()`
2. JavaScript injection extracts visible/interactable elements
3. Accessibility tree extracted via Chromium API
4. Combined into `DOMSnapshot` with stable reference IDs
5. Snapshot returned as structured data

## IPC Communication

All inter-process communication uses typed, validated messages:

```typescript
interface IPCMessage<T = unknown> {
  channel: string    // From IPC_CHANNELS constants
  payload: T         // Validated against expected type
  timestamp: number
  source: 'main' | 'renderer' | 'agent'
}
```

28 IPC channels cover:
- Tab lifecycle (create, close, activate, navigate)
- Page sensing (readDOM, screenshot, console, network)
- Agent control (execute, pause, resume, take over)
- Permissions (request, resolve, list, update)
- Annotations (create, resolve, list)
- Session management (start, stop, log)

## Directory Structure

```
src/
├── main/           # Electron main process
│   ├── index.ts    # Application entry, lifecycle
│   ├── ipc/        # IPC handler registration
│   ├── windows/    # WindowManager (window/tab lifecycle)
│   └── services/   # ProfileService, PermissionStore, SessionStore
├── preload/        # contextBridge API (typed, minimal surface)
├── renderer/       # React UI
│   └── src/
│       ├── App.tsx           # Root component
│       ├── components/       # TitleBar, TabStrip, AddressBar, Sidebar, WebView
│       ├── design-system/    # Button, Tooltip, Badge
│       └── styles/          # CSS variables, global styles
├── agent/          # Agent orchestration
│   ├── index.ts             # AgentOrchestrator (action dispatch)
│   ├── page-sensing/        # DOM, a11y, screenshot, console, network
│   ├── actions/             # ActionExecutor (navigate, click, type, etc.)
│   └── permissions/         # PermissionManager
└── shared/         # Cross-process types, constants, design tokens
```

## Security Boundaries

1. **Renderer ↔ Main**: Only through `contextBridge` (preload) and IPC
2. **Agent ↔ Main**: Through typed IPC channels only
3. **Agent ≠ Renderer**: No direct communication — all via main process
4. **DOM Access**: Read-only by default; write requires explicit approval
5. **File System**: Agent orchestration has no direct filesystem write access outside designated app-data directory
6. **Network**: No telemetry by default; request bodies excluded from logs
