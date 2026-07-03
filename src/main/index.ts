import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { initIpcHandlers } from './ipc/handlers'
import { WindowManager } from './windows/manager'
import { ProfileService } from './services/profile'
import { PermissionStore } from './services/permissions'
import { SessionStore } from './services/session'

let windowManager: WindowManager
let profileService: ProfileService
let permissionStore: PermissionStore
let sessionStore: SessionStore

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
  profileService = new ProfileService()
  permissionStore = new PermissionStore()
  sessionStore = new SessionStore()

  windowManager = new WindowManager()

  initIpcHandlers({
    permissionStore,
    sessionStore,
    windowManager,
    profileService,
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
})

export { windowManager, profileService, permissionStore, sessionStore }
