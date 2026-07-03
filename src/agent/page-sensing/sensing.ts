import { WebContents } from 'electron'
import {
  DOMSnapshot,
  ElementReference,
  AccessibilityNode,
  ScreenshotResult,
  ConsoleEntry,
  NetworkEntry,
  ActionResult,
} from '../../shared/types'

import { captureScreenshot } from './screenshot'
import { extractDOM } from './dom'
import { extractAccessibilityTree } from './a11y'
import { captureConsoleLogs } from './console'
import { captureNetworkLogs } from './network'

export class PageSensingLayer {
  async readDOM(webContents: WebContents): Promise<ActionResult> {
    try {
      const domSnapshot = await extractDOM(webContents)
      const a11yTree = await extractAccessibilityTree(webContents)
      const url = webContents.getURL()
      const title = webContents.getTitle()

      const snapshot: DOMSnapshot = {
        url,
        title,
        timestamp: Date.now(),
        elements: domSnapshot,
        accessibilityTree: a11yTree,
      }

      return {
        success: true,
        domSnapshot: snapshot,
        data: {
          elementCount: domSnapshot.length,
          a11yNodeCount: a11yTree.length,
        },
      }
    } catch (error) {
      return { success: false, error: `Failed to read DOM: ${error}` }
    }
  }

  async screenshot(webContents: WebContents): Promise<ActionResult> {
    try {
      const result = await captureScreenshot(webContents)
      return { success: true, screenshot: result }
    } catch (error) {
      return { success: false, error: `Failed to capture screenshot: ${error}` }
    }
  }

  async getConsoleLogs(webContents: WebContents): Promise<ActionResult> {
    try {
      const logs = await captureConsoleLogs(webContents)
      return {
        success: true,
        data: { logs },
      }
    } catch (error) {
      return { success: false, error: `Failed to get console logs: ${error}` }
    }
  }

  async getNetworkLogs(webContents: WebContents): Promise<ActionResult> {
    try {
      const logs = await captureNetworkLogs(webContents)
      return {
        success: true,
        data: { logs },
      }
    } catch (error) {
      return { success: false, error: `Failed to get network logs: ${error}` }
    }
  }
}
