export interface TabInfo {
  id: string
  title: string
  url: string
  isLoading: boolean
  isAgentControlled: boolean
  canGoBack: boolean
  canGoForward: boolean
}

export interface WindowInfo {
  id: string
  tabs: TabInfo[]
  activeTabId: string | null
}

export interface ElementReference {
  refId: string
  tagName: string
  role: string
  textContent: string
  boundingBox: BoundingBox | null
  attributes: Record<string, string>
  isVisible: boolean
  isInteractable: boolean
}

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface DOMSnapshot {
  url: string
  title: string
  timestamp: number
  elements: ElementReference[]
  accessibilityTree: AccessibilityNode[]
}

export interface AccessibilityNode {
  refId: string
  role: string
  name: string
  value: string
  description: string
  state: Record<string, boolean>
  children: AccessibilityNode[]
  bounds: BoundingBox | null
}

export interface ScreenshotResult {
  dataUrl: string
  width: number
  height: number
  mimeType: string
}

export interface ConsoleEntry {
  level: 'log' | 'warn' | 'error' | 'info' | 'debug'
  text: string
  timestamp: number
  source: string
  line: number
}

export interface NetworkEntry {
  method: string
  url: string
  status: number
  statusText: string
  timing: NetworkTiming | null
  mimeType: string
  timestamp: number
}

export interface NetworkTiming {
  startTime: number
  dnsEnd: number
  connectEnd: number
  sslEnd: number
  sendEnd: number
  receiveEnd: number
}

export interface AgentAction {
  id: string
  type: AgentActionType
  params: Record<string, unknown>
  timestamp: number
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled'
  result?: ActionResult
  sessionId?: string
}

export type AgentActionType =
  | 'navigate'
  | 'click'
  | 'doubleClick'
  | 'rightClick'
  | 'type'
  | 'scroll'
  | 'hover'
  | 'dragAndDrop'
  | 'selectOption'
  | 'uploadFile'
  | 'pressKey'
  | 'executeReadOnlyScript'
  | 'executeScript'
  | 'readDOM'
  | 'screenshot'
  | 'getConsoleLogs'
  | 'getNetworkLogs'

export interface ActionResult {
  success: boolean
  error?: string
  domSnapshot?: DOMSnapshot
  screenshot?: ScreenshotResult
  data?: unknown
}

export interface PermissionRule {
  domain: string
  action: 'allow' | 'block'
  createdAt: number
  updatedAt: number
}

export interface PermissionRequest {
  domain: string
  tabId: string
  action: string
  resolved: boolean
  resolution?: 'allow-once' | 'allow-always' | 'deny-once' | 'block-always'
}

export interface Annotation {
  id: string
  tabId: string
  elementRef: ElementReference | null
  regionBounds: BoundingBox | null
  comment: string
  structuredMetadata: Record<string, string>
  createdAt: number
  resolved: boolean
  resolvedAt?: number
}

export interface SessionLog {
  id: string
  tabId: string
  startTime: number
  endTime: number | null
  actions: AgentAction[]
  status: 'running' | 'paused' | 'completed' | 'failed'
}

export interface TaskSummary {
  sessionId: string
  actionsCount: number
  successfulActions: number
  failedActions: number
  urlsVisited: string[]
  startTime: number
  endTime: number
  screenshots: string[]
  summary: string
}

export interface IPCMessage<T = unknown> {
  channel: string
  payload: T
  timestamp: number
  source: 'main' | 'renderer' | 'agent'
}

export const IPC_CHANNELS = {
  // Window/Tab management
  TAB_CREATE: 'tab:create',
  TAB_CLOSE: 'tab:close',
  TAB_ACTIVATE: 'tab:activate',
  TAB_NAVIGATE: 'tab:navigate',
  TAB_RELOAD: 'tab:reload',
  TAB_GO_BACK: 'tab:goBack',
  TAB_GO_FORWARD: 'tab:goForward',
  TAB_DUPLICATE: 'tab:duplicate',
  WINDOW_CREATE: 'window:create',
  WINDOW_CLOSE: 'window:close',
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',

  // Tab state updates (main -> renderer)
  TAB_STATE_UPDATE: 'tab:stateUpdate',
  TAB_URL_CHANGED: 'tab:urlChanged',
  TAB_TITLE_CHANGED: 'tab:titleChanged',
  TAB_LOADING_CHANGED: 'tab:loadingChanged',
  TAB_NAVIGATION_STATE_CHANGED: 'tab:navigationStateChanged',

  // Page sensing
  PAGE_READ_DOM: 'page:readDOM',
  PAGE_SCREENSHOT: 'page:screenshot',
  PAGE_GET_CONSOLE: 'page:getConsole',
  PAGE_GET_NETWORK: 'page:getNetwork',

  // Agent actions
  AGENT_EXECUTE: 'agent:execute',
  AGENT_PAUSE: 'agent:pause',
  AGENT_RESUME: 'agent:resume',
  AGENT_TAKE_OVER: 'agent:takeOver',
  AGENT_STATUS_CHANGE: 'agent:statusChange',

  // Permission
  PERMISSION_REQUEST: 'permission:request',
  PERMISSION_RESOLVE: 'permission:resolve',
  PERMISSION_LIST: 'permission:list',
  PERMISSION_UPDATE: 'permission:update',
  PERMISSION_REMOVE: 'permission:remove',

  // Annotations
  ANNOTATION_CREATE: 'annotation:create',
  ANNOTATION_RESOLVE: 'annotation:resolve',
  ANNOTATION_LIST: 'annotation:list',

  // Sidebar
  SIDEBAR_ACTION_HISTORY: 'sidebar:actionHistory',
  SIDEBAR_UPDATE: 'sidebar:update',

  // Session
  SESSION_START: 'session:start',
  SESSION_STOP: 'session:stop',
  SESSION_LOG: 'session:log',

  // Sensitive actions
  SENSITIVE_ACTION_REQUEST: 'sensitive-action:request',
  SENSITIVE_ACTION_APPROVAL: 'sensitive-action:approval',
} as const

export const WINDOW_CONTROL_CHANNELS = {
  MINIMIZE: 'window:minimize',
  MAXIMIZE: 'window:maximize',
  CLOSE: 'window:close',
} as const
