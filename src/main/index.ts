import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { initIpcHandlers } from './ipc/handlers'
import { WindowManager } from './windows/manager'
import { ProfileService } from './services/profile'
import { PermissionStore } from './services/permissions'
import { SessionStore } from './services/session'
import { AgentOrchestrator } from '../agent/index'
import { Logger } from './logger'

let windowManager: WindowManager
let profileService: ProfileService
let permissionStore: PermissionStore
let sessionStore: SessionStore
let logger: Logger
let agentOrchestrator: AgentOrchestrator

async function createMainWindow(): Promise<BrowserWindow> {
  const win = windowManager.createWindow()

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

app.whenReady().then(async () => {
  logger = new Logger('Main')
  profileService = new ProfileService()
  permissionStore = new PermissionStore(logger)
  sessionStore = new SessionStore(logger)
  windowManager = new WindowManager()
  agentOrchestrator = new AgentOrchestrator({
    sessionStore,
    windowManager,
    permissionManager: permissionStore,
    logger,
  })

  initIpcHandlers({
    permissionStore,
    sessionStore,
    windowManager,
    profileService,
    agentOrchestrator,
    logger,
  })

  await createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  sessionStore.close()
  permissionStore.close()
  logger.info('Application closed.')
})

export { windowManager, profileService, permissionStore, sessionStore }
