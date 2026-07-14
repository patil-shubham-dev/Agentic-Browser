import { ipcMain } from 'electron'
import { PageSensingLayer } from './page-sensing/sensing'
import { ActionExecutor } from './actions/executor'
import { PermissionManager } from './permissions/manager'
import { IPC_CHANNELS, AgentAction, ActionResult, DOMSnapshot } from '../shared/types'
import { SessionStore } from '../main/services/session'
import { WindowManager } from '../main/windows/manager'
import { Logger } from '../main/logger'
import { ActionValidator } from './validators/action-validator'
import { ReferenceResolver } from './reference-resolver'

interface SessionState {
  running: boolean
  paused: boolean
  tabId: string
}

export class AgentOrchestrator {
  private sensingLayer: PageSensingLayer
  private actionExecutor: ActionExecutor
  private permissionManager: PermissionManager
  private sessionStore: SessionStore
  private windowManager: WindowManager
  private logger: Logger
  private actionValidator: ActionValidator
  private referenceResolver: ReferenceResolver
  private activeSessions: Map<string, SessionState> = new Map()
  private readonly MAX_CONCURRENT_SESSIONS = 10
  private readonly ACTION_TIMEOUT_MS = 30000 // 30 seconds

  constructor(deps: {
    sessionStore: SessionStore
    windowManager: WindowManager
    permissionManager: PermissionManager
    logger: Logger
  }) {
    this.sessionStore = deps.sessionStore
    this.windowManager = deps.windowManager
    this.permissionManager = deps.permissionManager
    this.logger = deps.logger
    this.sensingLayer = new PageSensingLayer()
    this.actionExecutor = new ActionExecutor()
    this.actionValidator = new ActionValidator()
    this.referenceResolver = new ReferenceResolver()
  }

  async startSession(tabId: string): Promise<string | { error: string }> {
    try {
      if (this.activeSessions.size >= this.MAX_CONCURRENT_SESSIONS) {
        const error = `Max concurrent sessions (${this.MAX_CONCURRENT_SESSIONS}) reached`
        this.logger.warn('startSession: Max sessions reached', { tabId })
        return { error }
      }

      const sessionId = this.sessionStore.createSession(tabId)
      this.activeSessions.set(sessionId, { running: true, paused: false, tabId })
      this.logger.info('startSession: Session started', { sessionId, tabId })
      return sessionId
    } catch (err: any) {
      const error = `Failed to start session: ${err?.message || 'Unknown error'}`
      this.logger.error('startSession failed:', err)
      return { error }
    }
  }

  async executeAction(sessionId: string, action: AgentAction): Promise<ActionResult> {
    try {
      // Validate session state
      const session = this.activeSessions.get(sessionId)
      if (!session || !session.running) {
        return { success: false, error: 'Session not active' }
      }
      if (session.paused) {
        return { success: false, error: 'Session paused' }
      }

      // Validate action structure
      const validation = this.actionValidator.validate(action)
      if (!validation.valid) {
        const errorMsg = `Action validation failed: ${validation.errors?.join(', ')}`
        this.logger.warn('executeAction: Validation failed', { sessionId, action, errors: validation.errors })
        return { success: false, error: errorMsg }
      }

      // Get tab info
      const tabId = action.params.tabId as string
      const tabInfo = this.windowManager.getWindowForTab(tabId)
      if (!tabInfo) {
        this.logger.warn('executeAction: Tab not found', { sessionId, tabId })
        return { success: false, error: 'Tab not found' }
      }

      // Check permissions
      const url = action.params.url as string
      if (url) {
        const domain = this.extractDomain(url)
        if (!domain) {
          this.logger.warn('executeAction: Invalid domain', { sessionId, url })
          return { success: false, error: 'Invalid or missing domain in URL' }
        }

        const permissionStatus = this.permissionManager.getPermissionStatus(domain)
        if (permissionStatus === 'blocked') {
          this.logger.warn('executeAction: Domain blocked', { sessionId, domain })
          return { success: false, error: `Domain ${domain} is blocked` }
        }

        if (permissionStatus === 'unknown') {
          this.logger.info('executeAction: Permission required', { sessionId, domain })
          return {
            success: false,
            error: 'Permission required',
            pendingApproval: true,
          }
        }
      }

      // Check for sensitive actions
      if (this.isSensitiveAction(action)) {
        const approved = await this.requestUserApproval(action)
        if (!approved) {
          this.logger.warn('executeAction: Sensitive action rejected', { sessionId, actionType: action.type })
          return { success: false, error: 'Sensitive action rejected by user' }
        }
      }

      // Log action before execution
      this.sessionStore.logAction(sessionId, action)

      // Execute action with timeout
      let result: ActionResult
      try {
        result = await Promise.race([
          this.executeActionSwitch(action, tabInfo),
          new Promise<ActionResult>((_, reject) =>
            setTimeout(() => reject(new Error('Action timeout')), this.ACTION_TIMEOUT_MS)
          ),
        ])
      } catch (err: any) {
        const errorMsg = `Action execution failed: ${err?.message || 'Unknown error'}`
        this.logger.error('executeAction: Execution error', { sessionId, actionType: action.type, error: err })
        result = { success: false, error: errorMsg }
      }

      // Update action status
      this.sessionStore.updateActionStatus(action.id, result.success ? 'success' : 'failed', result)
      return result
    } catch (err: any) {
      const errorMsg = `Unexpected error in executeAction: ${err?.message || 'Unknown'}`
      this.logger.error('executeAction: Unexpected error', err)
      return { success: false, error: errorMsg }
    }
  }

  private async executeActionSwitch(action: AgentAction, tabInfo: any): Promise<ActionResult> {
    try {
      switch (action.type) {
        case 'navigate':
          return await this.actionExecutor.navigate(tabInfo.win.webContents, action.params.url as string)

        case 'click': {
          const refId = action.params.elementRef as string
          const validation = await this.referenceResolver.validateElementRef(tabInfo.win.webContents, refId, action)
          if (!validation.valid) {
            return { success: false, error: validation.error }
          }
          return await this.actionExecutor.click(tabInfo.win.webContents, {
            ...action.params,
            elementRef: validation.resolvedRef,
          })
        }

        case 'type': {
          const refId = action.params.elementRef as string
          const validation = await this.referenceResolver.validateElementRef(tabInfo.win.webContents, refId, action)
          if (!validation.valid) {
            return { success: false, error: validation.error }
          }
          return await this.actionExecutor.type(tabInfo.win.webContents, {
            ...action.params,
            elementRef: validation.resolvedRef,
          })
        }

        case 'scroll':
          return await this.actionExecutor.scroll(tabInfo.win.webContents, action.params)

        case 'readDOM':
          return await this.sensingLayer.readDOM(tabInfo.win.webContents)

        case 'screenshot':
          return await this.sensingLayer.screenshot(tabInfo.win.webContents)

        case 'getConsoleLogs':
          return await this.sensingLayer.getConsoleLogs(tabInfo.win.webContents)

        case 'getNetworkLogs':
          return await this.sensingLayer.getNetworkLogs(tabInfo.win.webContents)

        case 'hover': {
          const refId = action.params.elementRef as string
          const validation = await this.referenceResolver.validateElementRef(tabInfo.win.webContents, refId, action)
          if (!validation.valid) {
            return { success: false, error: validation.error }
          }
          return await this.actionExecutor.hover(tabInfo.win.webContents, {
            ...action.params,
            elementRef: validation.resolvedRef,
          })
        }

        case 'doubleClick': {
          const refId = action.params.elementRef as string
          const validation = await this.referenceResolver.validateElementRef(tabInfo.win.webContents, refId, action)
          if (!validation.valid) {
            return { success: false, error: validation.error }
          }
          return await this.actionExecutor.doubleClick(tabInfo.win.webContents, {
            ...action.params,
            elementRef: validation.resolvedRef,
          })
        }

        case 'rightClick': {
          const refId = action.params.elementRef as string
          const validation = await this.referenceResolver.validateElementRef(tabInfo.win.webContents, refId, action)
          if (!validation.valid) {
            return { success: false, error: validation.error }
          }
          return await this.actionExecutor.rightClick(tabInfo.win.webContents, {
            ...action.params,
            elementRef: validation.resolvedRef,
          })
        }

        case 'dragAndDrop': {
          const sourceRefId = action.params.sourceRef as string
          const targetRefId = action.params.targetRef as string
          const sourceValidation = await this.referenceResolver.validateElementRef(
            tabInfo.win.webContents,
            sourceRefId,
            action
          )
          if (!sourceValidation.valid) {
            return { success: false, error: `Source: ${sourceValidation.error}` }
          }
          const targetValidation = await this.referenceResolver.validateElementRef(
            tabInfo.win.webContents,
            targetRefId,
            action
          )
          if (!targetValidation.valid) {
            return { success: false, error: `Target: ${targetValidation.error}` }
          }
          return await this.actionExecutor.dragAndDrop(tabInfo.win.webContents, {
            ...action.params,
            sourceRef: sourceValidation.resolvedRef,
            targetRef: targetValidation.resolvedRef,
          })
        }

        case 'selectOption': {
          const refId = action.params.elementRef as string
          const validation = await this.referenceResolver.validateElementRef(tabInfo.win.webContents, refId, action)
          if (!validation.valid) {
            return { success: false, error: validation.error }
          }
          return await this.actionExecutor.selectOption(tabInfo.win.webContents, {
            ...action.params,
            elementRef: validation.resolvedRef,
          })
        }

        case 'pressKey':
          return await this.actionExecutor.pressKey(tabInfo.win.webContents, action.params)

        case 'executeReadOnlyScript':
          return await this.actionExecutor.executeReadOnlyScript(
            tabInfo.win.webContents,
            action.params.script as string
          )

        default:
          return { success: false, error: `Unknown action type: ${action.type}` }
      }
    } catch (err: any) {
      const errorMsg = `Action switch error: ${err?.message || 'Unknown error'}`
      this.logger.error('executeActionSwitch failed:', err)
      return { success: false, error: errorMsg }
    }
  }

  pauseSession(sessionId: string): void {
    try {
      const session = this.activeSessions.get(sessionId)
      if (session) {
        session.paused = true
        this.logger.info('pauseSession: Session paused', { sessionId })
      }
    } catch (err: any) {
      this.logger.error('pauseSession failed:', err)
    }
  }

  resumeSession(sessionId: string): void {
    try {
      const session = this.activeSessions.get(sessionId)
      if (session) {
        session.paused = false
        this.logger.info('resumeSession: Session resumed', { sessionId })
      }
    } catch (err: any) {
      this.logger.error('resumeSession failed:', err)
    }
  }

  endSession(sessionId: string): void {
    try {
      this.activeSessions.delete(sessionId)
      this.sessionStore.endSession(sessionId)
      this.logger.info('endSession: Session ended', { sessionId })
    } catch (err: any) {
      this.logger.error('endSession failed:', err)
    }
  }

  private isSensitiveAction(action: AgentAction): boolean {
    const sensitiveTypes = ['executeScript', 'uploadFile']
    const sensitiveParams = ['password', 'credit-card', 'payment', 'cvv', 'ssn']

    if (sensitiveTypes.includes(action.type)) {
      return true
    }

    try {
      const paramStr = JSON.stringify(action.params).toLowerCase()
      return sensitiveParams.some((p) => paramStr.includes(p))
    } catch {
      return false
    }
  }

  private async requestUserApproval(action: AgentAction): Promise<boolean> {
    return new Promise((resolve) => {
      const channel = `sensitive-action-approval-${action.id}`
      const timeout = setTimeout(() => {
        ipcMain.removeAllListeners(channel)
        this.logger.warn('requestUserApproval: Timeout', { actionId: action.id })
        resolve(false)
      }, 60000)

      ipcMain.once(channel, (_event, approved) => {
        clearTimeout(timeout)
        this.logger.info('requestUserApproval: Response received', { actionId: action.id, approved })
        resolve(approved === true)
      })

      // Notify renderer to show approval dialog
      const mainWindow = require('electron').BrowserWindow.getFocusedWindow()
      if (mainWindow) {
        mainWindow.webContents.send('sensitive-action-request', action)
      }
    })
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname
    } catch {
      return ''
    }
  }
}
