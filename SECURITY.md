# Security Policy

## Supported Versions

Agentic Browser is currently in **alpha** development. Security updates are applied to the latest release and the main branch.

| Version | Supported |
|---|---|
| main (development) | ✅ Active development |
| 0.1.x (alpha) | ✅ Security patches |
| < 0.1.0 | ❌ Not supported |

## Security Architecture

Agentic Browser is designed with security as a foundational requirement, not an afterthought. The following measures are in place:

### Process Isolation
- **Renderer processes** are sandboxed per Electron/Chromium security defaults
- `nodeIntegration` is **disabled** in all web-content-facing renderers
- `contextIsolation` is **enabled** — renderer cannot access Node.js APIs
- Preload scripts provide a controlled, typed API surface via `contextBridge`

### Inter-Process Communication
- All IPC uses a validated, typed schema (`IPC_CHANNELS` constants)
- No arbitrary string-eval bridges between processes
- Messages are validated against expected types before processing

### Agent Execution Safety
- `executeScript` (write-capable JS execution) is **gated behind explicit per-action user approval**
- `executeReadOnlyScript` is sandboxed — DOM mutation is prevented via Proxy + strict mode
- Read-only script execution is the default; write access requires explicit consent
- All agent actions are logged in full (including script bodies) to the session log

### Permission System
- No network navigation or DOM action occurs on a domain absent from the allow list without triggering the first-contact prompt
- Sensitive actions (payment, password, file download, `executeScript`) **always** require explicit per-action confirmation — this is non-configurable in v1
- Domain allow/block list is persisted locally via SQLite, editable from settings

### Data Privacy
- **Local-first** — All session data, permission lists, and recordings are stored locally
- No mandatory cloud dependency — no telemetry of page content leaves the device by default
- Network request bodies are excluded from logs by default
- Credentials are never logged in plaintext under any configuration
- Ephemeral agent profiles leave no persistent trace after session end

### Crash Safety
- A renderer crash in one tab does not take down the main process or other tabs' agent sessions
- Agent action failures fail closed (halt and report) rather than retrying silently in a loop

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please follow these steps:

### Do NOT
- Do **not** open a public GitHub issue
- Do **not** discuss the vulnerability in public forums
- Do **not** create a pull request with the fix without prior coordination

### DO
1. **Report privately** by emailing [INSERT SECURITY EMAIL] or reaching out to the maintainers
2. Include a detailed description of the vulnerability
3. Provide steps to reproduce the issue
4. If possible, include a suggested fix or mitigation

### What to Expect
- **Acknowledgment** within 48 hours of your report
- **Initial assessment** within 5 business days
- **Regular updates** on progress every 7 days
- **Coordinated disclosure** — we will work with you on a timeline for public disclosure and credit

## Scope

The security policy covers:
- The Agentic Browser application code (all code in `src/`)
- Dependencies listed in `package.json`
- Build and CI/CD pipeline security

**Out of scope** for v1:
- General OS-level security outside the browser window
- Browser extension-based attack vectors (this is not an extension)
- Cloud/hosted services (there are none in v1 — the product is local-first)

## Best Practices for Contributors

When contributing code, please follow these security guidelines:

1. **Never** disable `contextIsolation` or enable `nodeIntegration` in renderers
2. **Never** expose raw Node.js APIs through the preload bridge
3. **Always** validate and sanitize data received through IPC
4. **Always** gate write-capable script execution behind permission checks
5. **Never** introduce telemetry that sends page content off-device by default
6. **Never** log credentials or sensitive data in plaintext
7. **Always** use the typed IPC schema rather than arbitrary string-based channels

## Security Review

A pre-release security review must be completed before any public-facing release, with:
- Zero critical findings (sandbox escape, unauthorized cross-domain action, credential leakage)
- All findings addressed or explicitly risk-accepted with documentation

---

*Security is not a feature — it is a constraint on every feature we build.*
