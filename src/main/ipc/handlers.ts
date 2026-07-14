import { ipcMain, BrowserWindow, dialog } from 'electron'
import { PermissionStore } from '../services/permissions'
import { SessionStore } from '../services/session'
import { WindowManager } from '../windows/manager'
import { ProfileService } from '../services/profile'
import { IPC_CHANNELS } from '../../shared/types'
import { Logger } from '../logger'

interface IpcHandlerDeps {
  permissionStore: PermissionStore
  sessionStore: SessionStore
  windowManager: WindowManager
  profileService: ProfileService
  agentOrchestrator: AgentOrchestrator
  logger: Logger
}

const pendingApprovals = new Map<string, { resolve: (approved: boolean) => void; timeout: NodeJS.Timeout }>()

export function initIpcHandlers(deps: IpcHandlerDeps): void {
  const { permissionStore, sessionStore, windowManager, profileService, agentOrchestrator, logger } = deps

  // Tab management handlers
  ipcMain.handle(IPC_CHANNELS.TAB_CREATE, (_event, url?: string) => {
    try {
      const win = BrowserWindow.getFocusedWindow()
      if (!win) {
        logger.warn('TAB_CREATE: No focused window')
        return { success: false, error: 'No focused window' }
      }
      logger.info('TAB_CREATE: Creating new tab', { url })
      return { success: true, tabId: `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` }
    } catch (err) {
      logger.error('TAB_CREATE failed:', err)
      return { success: false, error: 'Failed to create tab' }
    }
  })

  ipcMain.handle(IPC_CHANNELS.TAB_CLOSE, (_event, tabId: string) => {
    try {
      logger.info('TAB_CLOSE: Closing tab', { tabId })
      // End any active session for this tab
      const sessions = sessionStore.getAllSessions?.() || []
      const session = sessions.find((s: any) => s.tabId === tabId)
      if (session) {
        sessionStore.endSession(session.id)
        logger.info('TAB_CLOSE: Ended session for tab', { tabId, sessionId: session.id })
      }
      return { success: true }
    } catch (err) {
      logger.error('TAB_CLOSE failed:', err)
      return { success: false, error: 'Failed to close tab' }
    }
  })

  ipcMain.handle(IPC_CHANNELS.TAB_NAVIGATE, (_event, params: any) => {
    try {
      const { tabId, url } = params
      const win = BrowserWindow.getFocusedWindow()
      if (!win) {
        logger.warn('TAB_NAVIGATE: No focused window')
        return { success: false, error: 'No focused window' }
      }

      if (!url) {
        logger.warn('TAB_NAVIGATE: No URL provided')
        return { success: false, error: 'No URL provided' }
      }

      logger.info('TAB_NAVIGATE: Navigating', { tabId, url })
      win.webContents.loadURL(url).catch((err) => {
        logger.error('TAB_NAVIGATE: Failed to load URL:', err)
      })

      return { success: true, title: url, canGoBack: true, canGoForward: false }
    } catch (err) {
      logger.error('TAB_NAVIGATE failed:', err)
      return { success: false, error: 'Failed to navigate' }
    }
  })

  ipcMain.handle(IPC_CHANNELS.TAB_GO_BACK, (_event, tabId?: string) => {
    try {
      const win = BrowserWindow.getFocusedWindow()
      if (!win) {
        logger.warn('TAB_GO_BACK: No focused window')
        return { success: false }
      }
      if (!win.webContents.canGoBack()) {
        logger.warn('TAB_GO_BACK: Cannot go back')
        return { success: false }
      }
      logger.info('TAB_GO_BACK: Going back', { tabId })
      win.webContents.goBack()
      return { success: true }
    } catch (err) {
      logger.error('TAB_GO_BACK failed:', err)
      return { success: false }
    }
  })

  ipcMain.handle(IPC_CHANNELS.TAB_GO_FORWARD, (_event, tabId?: string) => {
    try {
      const win = BrowserWindow.getFocusedWindow()
      if (!win) {
        logger.warn('TAB_GO_FORWARD: No focused window')
        return { success: false }
      }
      if (!win.webContents.canGoForward()) {
        logger.warn('TAB_GO_FORWARD: Cannot go forward')
        return { success: false }
      }
      logger.info('TAB_GO_FORWARD: Going forward', { tabId })
      win.webContents.goForward()
      return { success: true }
    } catch (err) {
      logger.error('TAB_GO_FORWARD failed:', err)
      return { success: false }
    }
  })

  ipcMain.handle(IPC_CHANNELS.TAB_RELOAD, (_event, tabId?: string) => {
    try {
      const win = BrowserWindow.getFocusedWindow()
      if (!win) {
        logger.warn('TAB_RELOAD: No focused window')
        return { success: false }
      }
      logger.info('TAB_RELOAD: Reloading', { tabId })
      win.webContents.reload()
      return { success: true }
    } catch (err) {
      logger.error('TAB_RELOAD failed:', err)
      return { success: false }
    }
  })

  ipcMain.handle(IPC_CHANNELS.WINDOW_CREATE, () => {
    try {
      logger.info('WINDOW_CREATE: Creating new window')
      const win = windowManager.createWindow()
      return { success: true, windowId: win.id }
    } catch (err) {
      logger.error('WINDOW_CREATE failed:', err)
      return { success: false, error: 'Failed to create window' }
    }
  })

  ipcMain.handle(IPC_CHANNELS.WINDOW_MINIMIZE, () => {
    try {
      const win = BrowserWindow.getFocusedWindow()
      if (!win) {
        logger.warn('WINDOW_MINIMIZE: No focused window')
        return { success: false }
      }
      logger.info('WINDOW_MINIMIZE: Minimizing window')
      win.minimize()
      return { success: true }
    } catch (err) {
      logger.error('WINDOW_MINIMIZE failed:', err)
      return { success: false }
    }
  })

  ipcMain.handle(IPC_CHANNELS.WINDOW_MAXIMIZE, () => {
    try {
      const win = BrowserWindow.getFocusedWindow()
      if (!win) {
        logger.warn('WINDOW_MAXIMIZE: No focused window')
        return { success: false }
      }
      logger.info('WINDOW_MAXIMIZE: Maximizing window')
      if (win.isMaximized()) {
        win.unmaximize()
      } else {
        win.maximize()
      }
      return { success: true }
    } catch (err) {
      logger.error('WINDOW_MAXIMIZE failed:', err)
      return { success: false }
    }
  })

  ipcMain.handle(IPC_CHANNELS.WINDOW_CLOSE, () => {
    try {
      const win = BrowserWindow.getFocusedWindow()
      if (!win) {
        logger.warn('WINDOW_CLOSE: No focused window')
        return { success: false }
      }
      logger.info('WINDOW_CLOSE: Closing window')
      win.close()
      return { success: true }
    } catch (err) {
      logger.error('WINDOW_CLOSE failed:', err)
      return { success: false }
    }
  })

  // Permission handlers
  ipcMain.handle(IPC_CHANNELS.PERMISSION_LIST, () => {
    try {
      logger.info('PERMISSION_LIST: Fetching all permissions')
      return permissionStore.getAllRules()
    } catch (err) {
      logger.error('PERMISSION_LIST failed:', err)
      return []
    }
  })

  ipcMain.handle(IPC_CHANNELS.PERMISSION_UPDATE, (_event, domain: string, action: 'allow' | 'block') => {
    try {
      logger.info('PERMISSION_UPDATE: Updating permission', { domain, action })
      permissionStore.setRule(domain, action)
      return permissionStore.getRule(domain)
    } catch (err) {
      logger.error('PERMISSION_UPDATE failed:', err)
      return null
    }
  })

  ipcMain.handle(IPC_CHANNELS.PERMISSION_REMOVE, (_event, domain: string) => {
    try {
      logger.info('PERMISSION_REMOVE: Removing permission', { domain })
      permissionStore.removeRule(domain)
      return { success: true }
    } catch (err) {
      logger.error('PERMISSION_REMOVE failed:', err)
      return { success: false, error: 'Failed to remove permission' }
    }
  })

  ipcMain.handle(IPC_CHANNELS.PERMISSION_REQUEST, (_event, domain: string) => {
    try {
      logger.info('PERMISSION_REQUEST: Requesting permission', { domain })
      if (permissionStore.isBlocked(domain)) {
        return { resolved: true, resolution: 'block-always' }
      }
      if (permissionStore.isAllowed(domain)) {
        return { resolved: true, resolution: 'allow-always' }
      }
      return { resolved: false, resolution: null }
    } catch (err) {
      logger.error('PERMISSION_REQUEST failed:', err)
      return { resolved: false, resolution: null }
    }
  })

  // Session handlers
  ipcMain.handle(IPC_CHANNELS.SESSION_START, (_event, tabId: string) => {
    try {
      logger.info('SESSION_START: Starting session', { tabId })
      return sessionStore.createSession(tabId)
    } catch (err) {
      logger.error('SESSION_START failed:', err)
      return null
    }
  })

  ipcMain.handle(IPC_CHANNELS.SESSION_STOP, (_event, sessionId: string) => {
    try {
      logger.info('SESSION_STOP: Stopping session', { sessionId })
      sessionStore.endSession(sessionId)
      return { success: true }
    } catch (err) {
      logger.error('SESSION_STOP failed:', err)
      return { success: false, error: 'Failed to stop session' }
    }
  })

  ipcMain.handle(IPC_CHANNELS.SESSION_LOG, (_event, sessionId: string) => {
    try {
      logger.info('SESSION_LOG: Fetching session log', { sessionId })
      return sessionStore.getSession(sessionId)
    } catch (err) {
      logger.error('SESSION_LOG failed:', err)
      return null
    }
  })

  // Sensitive action handlers
  ipcMain.handle(IPC_CHANNELS.SENSITIVE_ACTION_APPROVAL, (_event, actionId: string, approved: boolean) => {
    try {
      logger.info('SENSITIVE_ACTION_APPROVAL: Processing approval', { actionId, approved })
      const approval = pendingApprovals.get(actionId)
      if (approval) {
        clearTimeout(approval.timeout)
        approval.resolve(approved)
        pendingApprovals.delete(actionId)
      }
      return { success: true }
    } catch (err) {
      logger.error('SENSITIVE_ACTION_APPROVAL failed:', err)
      return { success: false, error: 'Failed to process approval' }
    }
  })

  // Dialog handlers
  ipcMain.handle('dialog:openFile', async () => {
    try {
      const win = BrowserWindow.getFocusedWindow()
      if (!win) {
        logger.warn('dialog:openFile: No focused window')
        return null
      }
      logger.info('dialog:openFile: Opening file dialog')
      const result = await dialog.showOpenDialog(win, {
        properties: ['openFile'],
      })
      return result.filePaths[0] || null
    } catch (err) {
      logger.error('dialog:openFile failed:', err)
      return null
    }
  })
}

export function requestSensitiveActionApproval(
  actionId: string,
  action: any,
  timeoutMs: number = 60000
): Promise<boolean> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      pendingApprovals.delete(actionId)
      resolve(false)
    }, timeoutMs)

    pendingApprovals.set(actionId, { resolve, timeout })

    const win = BrowserWindow.getFocusedWindow()
    if (win) {
      win.webContents.send(IPC_CHANNELS.SENSITIVE_ACTION_REQUEST, { id: actionId, ...action })
    }
  })
}
