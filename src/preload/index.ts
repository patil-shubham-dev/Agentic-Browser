import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS, PermissionRule } from '../shared/types'

const api = {
  // Tab management
  createTab: (url?: string) => ipcRenderer.invoke(IPC_CHANNELS.TAB_CREATE, url),
  closeTab: (tabId: string) => ipcRenderer.invoke(IPC_CHANNELS.TAB_CLOSE, tabId),
  navigate: (url: string) => ipcRenderer.invoke(IPC_CHANNELS.TAB_NAVIGATE, url),
  goBack: () => ipcRenderer.invoke(IPC_CHANNELS.TAB_GO_BACK),
  goForward: () => ipcRenderer.invoke(IPC_CHANNELS.TAB_GO_FORWARD),
  reload: () => ipcRenderer.invoke(IPC_CHANNELS.TAB_RELOAD),
  createWindow: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_CREATE),

  // Tab state listeners
  onTabStateUpdate: (callback: (data: unknown) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data)
    ipcRenderer.on(IPC_CHANNELS.TAB_STATE_UPDATE, handler)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.TAB_STATE_UPDATE, handler)
  },
  onUrlChanged: (callback: (data: { tabId: string; url: string }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { tabId: string; url: string }) =>
      callback(data)
    ipcRenderer.on(IPC_CHANNELS.TAB_URL_CHANGED, handler)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.TAB_URL_CHANGED, handler)
  },
  onTitleChanged: (callback: (data: { tabId: string; title: string }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { tabId: string; title: string }) =>
      callback(data)
    ipcRenderer.on(IPC_CHANNELS.TAB_TITLE_CHANGED, handler)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.TAB_TITLE_CHANGED, handler)
  },
  onLoadingChanged: (callback: (data: { tabId: string; isLoading: boolean }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: { tabId: string; isLoading: boolean }) =>
      callback(data)
    ipcRenderer.on(IPC_CHANNELS.TAB_LOADING_CHANGED, handler)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.TAB_LOADING_CHANGED, handler)
  },
  onNavigationStateChanged: (
    callback: (data: { tabId: string; canGoBack: boolean; canGoForward: boolean }) => void
  ) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      data: { tabId: string; canGoBack: boolean; canGoForward: boolean }
    ) => callback(data)
    ipcRenderer.on(IPC_CHANNELS.TAB_NAVIGATION_STATE_CHANGED, handler)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.TAB_NAVIGATION_STATE_CHANGED, handler)
  },

  // Permissions
  getPermissionList: () => ipcRenderer.invoke(IPC_CHANNELS.PERMISSION_LIST),
  updatePermission: (domain: string, action: 'allow' | 'block') =>
    ipcRenderer.invoke(IPC_CHANNELS.PERMISSION_UPDATE, domain, action),
  removePermission: (domain: string) => ipcRenderer.invoke(IPC_CHANNELS.PERMISSION_REMOVE, domain),
  requestPermission: (domain: string) => ipcRenderer.invoke(IPC_CHANNELS.PERMISSION_REQUEST, domain),

  // Sessions
  startSession: (tabId: string) => ipcRenderer.invoke(IPC_CHANNELS.SESSION_START, tabId),
  stopSession: (sessionId: string) => ipcRenderer.invoke(IPC_CHANNELS.SESSION_STOP, sessionId),
  getSession: (sessionId: string) => ipcRenderer.invoke(IPC_CHANNELS.SESSION_LOG, sessionId),

  // Agent control
  executeAgentAction: (action: unknown) => ipcRenderer.invoke(IPC_CHANNELS.AGENT_EXECUTE, action),
  pauseAgent: () => ipcRenderer.invoke(IPC_CHANNELS.AGENT_PAUSE),
  resumeAgent: () => ipcRenderer.invoke(IPC_CHANNELS.AGENT_RESUME),
  takeOver: () => ipcRenderer.invoke(IPC_CHANNELS.AGENT_TAKE_OVER),

  // Dialogs
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
