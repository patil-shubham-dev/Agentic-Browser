import { ipcMain } from 'electron'
import { PageSensingLayer } from './page-sensing/sensing'
import { ActionExecutor } from './actions/executor'
import { PermissionManager } from './permissions/manager'
import { IPC_CHANNELS, AgentAction, ActionResult, DOMSnapshot } from '../shared/types'
import { SessionStore } from '../main/services/session'
import { WindowManager } from '../main/windows/manager'

export class AgentOrchestrator {
  private sensingLayer: PageSensingLayer
  private actionExecutor: ActionExecutor
  private permissionManager: PermissionManager
  private sessionStore: SessionStore
  private windowManager: WindowManager
  private activeSessions: Map<string, { running: boolean; paused: boolean }> = new Map()

  constructor(deps: {
    sessionStore: SessionStore
    windowManager: WindowManager
    permissionManager: PermissionManager
  }) {
    this.sessionStore = deps.sessionStore
    this.windowManager = deps.windowManager
    this.permissionManager = deps.permissionManager
    this.sensingLayer = new PageSensingLayer()
    this.actionExecutor = new ActionExecutor()
  }

  async startSession(tabId: string): Promise<string> {
    const sessionId = this.sessionStore.createSession(tabId)
    this.activeSessions.set(sessionId, { running: true, paused: false })
    return sessionId
  }

  async executeAction(sessionId: string, action: AgentAction): Promise<ActionResult> {
    const session = this.activeSessions.get(sessionId)
    if (!session || !session.running) {
      return { success: false, error: 'Session not active' }
    }
    if (session.paused) {
      return { success: false, error: 'Session paused' }
    }

    const tabInfo = this.windowManager.getWindowForTab(action.params.tabId as string)
    if (!tabInfo) {
      return { success: false, error: 'Tab not found' }
    }

    const domain = this.extractDomain(action.params.url as string || '')
    if (domain && !this.permissionManager.isActionAllowed(domain)) {
      return { success: false, error: `Domain ${domain} not in allow list` }
    }

    this.sessionStore.logAction(sessionId, action)

    let result: ActionResult
    switch (action.type) {
      case 'navigate':
        result = await this.actionExecutor.navigate(tabInfo.win.webContents, action.params.url as string)
        break
      case 'click':
        result = await this.actionExecutor.click(tabInfo.win.webContents, action.params)
        break
      case 'type':
        result = await this.actionExecutor.type(tabInfo.win.webContents, action.params)
        break
      case 'scroll':
        result = await this.actionExecutor.scroll(tabInfo.win.webContents, action.params)
        break
      case 'readDOM':
        result = await this.sensingLayer.readDOM(tabInfo.win.webContents)
        break
      case 'screenshot':
        result = await this.sensingLayer.screenshot(tabInfo.win.webContents)
        break
      case 'getConsoleLogs':
        result = await this.sensingLayer.getConsoleLogs(tabInfo.win.webContents)
        break
      case 'getNetworkLogs':
        result = await this.sensingLayer.getNetworkLogs(tabInfo.win.webContents)
        break
      case 'hover':
        result = await this.actionExecutor.hover(tabInfo.win.webContents, action.params)
        break
      case 'doubleClick':
        result = await this.actionExecutor.doubleClick(tabInfo.win.webContents, action.params)
        break
      case 'rightClick':
        result = await this.actionExecutor.rightClick(tabInfo.win.webContents, action.params)
        break
      case 'dragAndDrop':
        result = await this.actionExecutor.dragAndDrop(tabInfo.win.webContents, action.params)
        break
      case 'selectOption':
        result = await this.actionExecutor.selectOption(tabInfo.win.webContents, action.params)
        break
      case 'pressKey':
        result = await this.actionExecutor.pressKey(tabInfo.win.webContents, action.params)
        break
      case 'executeReadOnlyScript':
        result = await this.actionExecutor.executeReadOnlyScript(tabInfo.win.webContents, action.params.script as string)
        break
      default:
        result = { success: false, error: `Unknown action type: ${action.type}` }
    }

    this.sessionStore.updateActionStatus(action.id, result.success ? 'success' : 'failed', result)
    return result
  }

  pauseSession(sessionId: string): void {
    const session = this.activeSessions.get(sessionId)
    if (session) {
      session.paused = true
    }
  }

  resumeSession(sessionId: string): void {
    const session = this.activeSessions.get(sessionId)
    if (session) {
      session.paused = false
    }
  }

  endSession(sessionId: string): void {
    this.activeSessions.delete(sessionId)
    this.sessionStore.endSession(sessionId)
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname
    } catch {
      return ''
    }
  }
}
