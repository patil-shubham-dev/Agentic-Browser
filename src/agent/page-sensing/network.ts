import { WebContents } from 'electron'
import { NetworkEntry } from '../../shared/types'

export async function captureNetworkLogs(webContents: WebContents): Promise<NetworkEntry[]> {
  const logs: NetworkEntry[] = []

  try {
    const result = await webContents.executeJavaScript(`
      (() => {
        const entries = performance.getEntriesByType('resource');
        return entries.map(entry => ({
          method: 'GET',
          url: entry.name,
          status: 200,
          statusText: 'OK',
          timing: {
            startTime: entry.startTime,
            dnsEnd: entry.domainLookupEnd,
            connectEnd: entry.connectEnd,
            sslEnd: entry.secureConnectionStart || entry.connectEnd,
            sendEnd: entry.requestStart,
            receiveEnd: entry.responseEnd,
          },
          mimeType: entry.contentType || '',
          timestamp: Date.now(),
        }));
      })()
    `, true)

    return result as NetworkEntry[]
  } catch {
    return logs
  }
}
