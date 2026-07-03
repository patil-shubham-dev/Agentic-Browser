import { WebContents } from 'electron'
import { ScreenshotResult } from '../../shared/types'

export async function captureScreenshot(webContents: WebContents): Promise<ScreenshotResult> {
  const image = await webContents.capturePage()
  const dataUrl = image.toDataURL()

  return {
    dataUrl,
    width: image.getSize().width,
    height: image.getSize().height,
    mimeType: 'image/png',
  }
}
