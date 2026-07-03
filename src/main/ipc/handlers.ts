import { ipcMain, BrowserWindow, dialog } from 'electron'
import { PermissionStore } from '../services/permissions'
import { SessionStore } from '../services/session'
import { WindowManager } from '../windows/manager'
import { ProfileService } from '../services/profile'
import { IPC_CHANNELS } from '../../shared/types'

interface IpcHandlerDeps {
  permissionStore: PermissionStore
  sessionStore: SessionStore
  windowManager: WindowManager
  profileService: ProfileService
}

export function initIpcHandlers(deps: IpcHandlerDeps): void {
  const { permissionStore, sessionStore, windowManager, profileService } = deps

  ipcMain.handle(IPC_CHANNELS.TAB_CREATE, (_event, url?: string) => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return null
    return null
  })

  ipcMain.handle(IPC_CHANNELS.TAB_CLOSE, (_event, tabId: string) => {
    return null
  })

  ipcMain.handle(IPC_CHANNELS.TAB_NAVIGATE, (_event, url: string) => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return
    win.webContents.send(IPC_CHANNELS.TAB_NAVIGATE, url)
  })

  ipcMain.handle(IPC_CHANNELS.TAB_GO_BACK, () => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win?.webContents.canGoBack()) return
    win.webContents.goBack()
  })

  ipcMain.handle(IPC_CHANNELS.TAB_GO_FORWARD, () => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win?.webContents.canGoForward()) return
    win.webContents.goForward()
  })

  ipcMain.handle(IPC_CHANNELS.TAB_RELOAD, () => {
    const win = BrowserWindow.getFocusedWindow()
    win?.webContents.reload()
  })

  ipcMain.handle(IPC_CHANNELS.WINDOW_CREATE, () => {
    return null
  })

  // Permission handlers
  ipcMain.handle(IPC_CHANNELS.PERMISSION_LIST, () => {
    return permissionStore.getAllRules()
  })

  ipcMain.handle(IPC_CHANNELS.PERMISSION_UPDATE, (_event, domain: string, action: 'allow' | 'block') => {
    permissionStore.setRule(domain, action)
    return permissionStore.getRule(domain)
  })

  ipcMain.handle(IPC_CHANNELS.PERMISSION_REMOVE, (_event, domain: string) => {
    permissionStore.removeRule(domain)
  })

  // Permission request from renderer
  ipcMain.handle(IPC_CHANNELS.PERMISSION_REQUEST, (_event, domain: string) => {
    if (permissionStore.isBlocked(domain)) {
      return { resolved: true, resolution: 'block-always' }
    }
    return { resolved: false, resolution: null }
  })

  // Session handlers
  ipcMain.handle(IPC_CHANNELS.SESSION_START, (_event, tabId: string) => {
    return sessionStore.createSession(tabId)
  })

  ipcMain.handle(IPC_CHANNELS.SESSION_STOP, (_event, sessionId: string) => {
    sessionStore.endSession(sessionId)
  })

  ipcMain.handle(IPC_CHANNELS.SESSION_LOG, (_event, sessionId: string) => {
    return sessionStore.getSession(sessionId)
  })

  // Dialog handlers
  ipcMain.handle('dialog:openFile', async () => {
    const win = BrowserWindow.getFocusedWindow()
    if (!win) return null
    const result = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
    })
    return result.filePaths[0] || null
  })
}
