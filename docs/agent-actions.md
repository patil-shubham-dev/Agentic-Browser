# Agent Actions Reference

This document describes all structured actions the LLM agent can invoke against a page.

## Overview

Actions are structured, tool-call-compatible operations that produce auditable, replayable results. The agent never controls the browser through raw OS input by default — it issues actions against a page-sensing abstraction layer built on CDP.

## Action Schema

```typescript
interface AgentAction {
  id: string
  type: AgentActionType
  params: Record<string, unknown>
  timestamp: number
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled'
  result?: ActionResult
}

interface ActionResult {
  success: boolean
  error?: string
  domSnapshot?: DOMSnapshot
  screenshot?: ScreenshotResult
  data?: unknown
}
```

## Action Types

### Navigation

#### `navigate(url)`
Load a URL in a target tab.

```typescript
{
  type: 'navigate',
  params: { url: 'https://example.com' }
}
```

**Returns:**
- `data.url` — Resolved URL after navigation
- `data.title` — Page title after load

---

### Mouse Actions

#### `click(elementRef)`
Click an element using its reference ID or CSS selector.

```typescript
{
  type: 'click',
  params: { refId: 'ref-1' }
}
// or
{
  type: 'click',
  params: { selector: '#submit-btn' }
}
```

**Returns:**
- `data.action` — "click"
- `data.selector` — Resolved selector used

#### `doubleClick(elementRef)`
Double-click an element.

```typescript
{
  type: 'doubleClick',
  params: { refId: 'ref-1' }
}
```

#### `rightClick(elementRef)`
Right-click (context menu) on an element.

```typescript
{
  type: 'rightClick',
  params: { refId: 'ref-1' }
}
```

#### `hover(elementRef)`
Hover over an element (triggers mouseenter/mouseover events).

```typescript
{
  type: 'hover',
  params: { refId: 'ref-1' }
}
```

#### `dragAndDrop(sourceRef, targetRef)`
Drag an element and drop it onto another element.

```typescript
{
  type: 'dragAndDrop',
  params: {
    sourceRefId: 'drag-1',
    targetRefId: 'drop-zone'
  }
}
```

---

### Keyboard Actions

#### `type(elementRef, text, { clear })`
Focus an element and input text with native input events.

```typescript
{
  type: 'type',
  params: {
    refId: 'input-1',
    text: 'Hello World',
    clear: true   // Clear existing content first
  }
}
```

**Note:** Uses native `input`/`change`/`blur` events, compatible with React, Vue, and Angular controlled components.

#### `pressKey(key, modifiers)`
Send a keyboard shortcut.

```typescript
{
  type: 'pressKey',
  params: {
    key: 'Enter',
    modifiers: ['ctrlKey', 'shiftKey']
  }
}
```

---

### Scrolling

#### `scroll(elementRef, direction, amount)`
Scroll a page or element.

```typescript
{
  type: 'scroll',
  params: {
    direction: 'down',    // 'up' | 'down' | number
    amount: 300,
    selector: '#content'  // Optional: scroll specific element
  }
}
```

---

### Form Actions

#### `selectOption(elementRef, value)`
Select an option from a `<select>` or ARIA listbox.

```typescript
{
  type: 'selectOption',
  params: {
    refId: 'select-1',
    value: 'option-2'
  }
}
```

#### `uploadFile(elementRef, filePath)`
Upload a file through a file input.

```typescript
{
  type: 'uploadFile',
  params: {
    refId: 'file-input-1',
    filePath: '/path/to/file.pdf'
  }
}
```

**Note:** Programmatic file input handling — avoids OS file-picker automation where possible.

---

### Script Execution

#### `executeReadOnlyScript(js)`
Execute JavaScript in a sandboxed, read-only context. DOM mutation is prevented.

```typescript
{
  type: 'executeReadOnlyScript',
  params: {
    script: 'return document.querySelectorAll("button").length'
  }
}
```

**Security:** Enforced by:
- `Proxy` on the window object that prevents `set`/`deleteProperty`/`defineProperty`
- `'use strict'` mode
- Restricted execution context

**Returns:** `data.result` — The return value of the script.

#### `executeScript(js)`
Full JavaScript execution with write capability.

```typescript
{
  type: 'executeScript',
  params: {
    script: 'document.title = "Modified"'
  }
}
```

**Security:** Gated behind explicit per-action user approval unless autonomous mode is enabled for the session. Always logged in full (including script body).

---

### Page Sensing

#### `readDOM()`
Extract the current DOM snapshot and accessibility tree.

```typescript
{
  type: 'readDOM',
  params: {}
}
```

**Returns:**
- `domSnapshot` — Full DOM snapshot with elements and accessibility tree
- `data.elementCount` — Number of interactable elements found

#### `screenshot()`
Capture the current viewport as a PNG screenshot.

```typescript
{
  type: 'screenshot',
  params: {}
}
```

**Returns:**
- `screenshot` — Base64-encoded PNG with width/height metadata

#### `getConsoleLogs()`
Get captured console log entries.

```typescript
{
  type: 'getConsoleLogs',
  params: {}
}
```

**Returns:**
- `data.logs` — Array of ConsoleEntry objects (level, text, timestamp, source, line)

#### `getNetworkLogs()`
Get captured network request/response entries.

```typescript
{
  type: 'getNetworkLogs',
  params: {}
}
```

**Returns:**
- `data.logs` — Array of NetworkEntry objects (method, url, status, timing, mimeType)

---

## Action Results

Every action returns a structured result:

```typescript
// Successful action
{
  success: true,
  domSnapshot: { /* current DOM state */ },
  screenshot: { /* current viewport */ },
  data: { /* action-specific response */ }
}

// Failed action
{
  success: false,
  error: "Navigation failed: ERR_CONNECTION_REFUSED"
}
```

## Action Queue

- Actions are processed sequentially within a session
- A configurable max-retry (default 2) applies per action before failing
- The action queue can be cancelled at any point via the "take over" control
- Pause takes effect after the current in-flight action completes
