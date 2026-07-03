import { BrowserWindow, BrowserView, WebContentsView } from 'electron'
import { join } from 'path'
import { TabInfo, WindowInfo } from '../../shared/types'

let windowCounter = 0
let tabCounter = 0

export class WindowManager {
  private windows: Map<string, BrowserWindow> = new Map()
  private windowInfos: Map<string, WindowInfo> = new Map()

  createWindow(): BrowserWindow {
    const id = `win-${++windowCounter}`
    const win = new BrowserWindow({
      width: 1440,
      height: 900,
      minWidth: 1024,
      minHeight: 600,
      frame: false,
      titleBarStyle: 'hidden',
      backgroundColor: '#0D0D0D',
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
      },
      show: false,
    })

    win.once('ready-to-show', () => {
      win.show()
    })

    const winInfo: WindowInfo = {
      id,
      tabs: [],
      activeTabId: null,
    }

    this.windows.set(id, win)
    this.windowInfos.set(id, winInfo)

    win.on('closed', () => {
      this.windows.delete(id)
      this.windowInfos.delete(id)
    })

    return win
  }

  getWindow(id: string): BrowserWindow | undefined {
    return this.windows.get(id)
  }

  getWindowInfo(id: string): WindowInfo | undefined {
    return this.windowInfos.get(id)
  }

  getWindowForTab(tabId: string): { win: BrowserWindow; winId: string } | null {
    for (const [winId, win] of this.windows) {
      const info = this.windowInfos.get(winId)
      if (info?.tabs.some(t => t.id === tabId)) {
        return { win, winId }
      }
    }
    return null
  }

  updateTab(id: string, updates: Partial<TabInfo>): void {
    for (const [, info] of this.windowInfos) {
      const tab = info.tabs.find(t => t.id === id)
      if (tab) {
        Object.assign(tab, updates)
        break
      }
    }
  }

  getAllWindows(): BrowserWindow[] {
    return Array.from(this.windows.values())
  }

  getAllWindowInfos(): WindowInfo[] {
    return Array.from(this.windowInfos.values())
  }
}
