import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'

export class VisualRegressor {
  compareScreenshots(
    baseline: Buffer,
    current: Buffer,
    width: number,
    height: number
  ): { pixelsDifferent: number; percentDifferent: number; diffImage: Buffer } {
    const img1 = PNG.sync.read(baseline)
    const img2 = PNG.sync.read(current)
    const {
      width: w,
      height: h
    } = img1
    const diff = new PNG({
      width: w,
      height: h
    })

    const numDiffPixels = pixelmatch(img1.data, img2.data, diff.data, w, h, {
      threshold: 0.1
    })

    return {
      pixelsDifferent: numDiffPixels,
      percentDifferent: (numDiffPixels / (width * height)) * 100,
      diffImage: PNG.sync.write(diff),
    }
  }
}
