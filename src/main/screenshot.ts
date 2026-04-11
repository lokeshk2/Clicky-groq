import { desktopCapturer, nativeImage } from 'electron'

export interface ScreenshotResult {
  /** Base64 JPEG without data: prefix */
  jpegBase64: string
  width: number
  height: number
}

/**
 * Capture primary screen as JPEG base64 (no data: prefix) plus pixel size.
 */
export async function captureScreenJpeg(): Promise<ScreenshotResult> {
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: 1920, height: 1080 }
  })

  if (!sources.length) {
    throw new Error('No screen sources available')
  }

  const source = sources[0]
  const img = nativeImage.createFromDataURL(source.thumbnail.toDataURL())
  const size = img.getSize()

  const jpeg = img.toJPEG(72)
  return {
    jpegBase64: jpeg.toString('base64'),
    width: size.width,
    height: size.height
  }
}
