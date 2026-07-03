import { WebContents } from 'electron'
import { ConsoleEntry } from '../../shared/types'

export async function captureConsoleLogs(webContents: WebContents): Promise<ConsoleEntry[]> {
  const logs: ConsoleEntry[] = []
  const session = webContents.debugger

  try {
    if (!session.isAttached()) {
      session.attach('1.3')
    }

    await session.sendCommand('Console.enable')

    const result = await session.sendCommand('Console.getMessages')
    const messages = (result as { messages: Array<{ level: string; text: string; source: string; line: number; timestamp: number }> }).messages || []

    for (const msg of messages) {
      logs.push({
        level: msg.level as ConsoleEntry['level'],
        text: msg.text,
        timestamp: msg.timestamp || Date.now(),
        source: msg.source || 'unknown',
        line: msg.line || 0,
      })
    }
  } catch {
    // Debugger not available, collect via console hook injection
    try {
      const capturedLogs = await webContents.executeJavaScript(`
        (() => {
          const logs = window.__capturedConsoleLogs || [];
          return logs.slice(-100);
        })()
      `, true)
      return capturedLogs as ConsoleEntry[]
    } catch {
      // Return empty if neither method works
    }
  }

  return logs
}
