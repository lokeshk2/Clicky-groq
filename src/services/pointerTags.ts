import type { SerializedDisplay } from '@shared/types'

function pointRegex(): RegExp {
  return /\[POINT:(\d+),(\d+):([^:\]]+):screen(\d+)\]/g
}

export function stripPointTags(text: string): string {
  return text
    .replace(pointRegex(), '')
    .replace(/\s+/g, ' ')
    .trim()
}

export interface MappedPoint {
  x: number
  y: number
  label: string
  screen: number
}

function pickPrimaryDisplay(displays: SerializedDisplay[]): SerializedDisplay {
  const internal = displays.find((d) => d.internal)
  return internal ?? displays[0]!
}

export function mapPointToGlobal(
  thumbX: number,
  thumbY: number,
  thumbW: number,
  thumbH: number,
  displays: SerializedDisplay[]
): { x: number; y: number } | null {
  if (!displays.length || thumbW <= 0 || thumbH <= 0) return null

  const primary = pickPrimaryDisplay(displays)
  const pb = primary.bounds
  const scale = Math.min(pb.width / thumbW, pb.height / thumbH)
  const sx = pb.x + thumbX * scale
  const sy = pb.y + thumbY * scale
  return { x: sx, y: sy }
}

export function extractCompletePointTags(
  s: string,
  thumbW: number,
  thumbH: number,
  displays: SerializedDisplay[]
): { rest: string; points: MappedPoint[] } {
  const points: MappedPoint[] = []
  const rest = s.replace(pointRegex(), (_full, xs, ys, label, screenS) => {
    const x = Number(xs)
    const y = Number(ys)
    const screenTag = Number(screenS)
    const mapped = mapPointToGlobal(x, y, thumbW, thumbH, displays)
    if (mapped) {
      points.push({ x: mapped.x, y: mapped.y, label: String(label), screen: screenTag })
    }
    return ''
  })
  return { rest, points }
}

function splitPartialTag(buf: string): { complete: string; partial: string } {
  const idx = buf.lastIndexOf('[')
  if (idx === -1) return { complete: buf, partial: '' }
  const tail = buf.slice(idx)
  if (tail.includes(']')) return { complete: buf, partial: '' }
  if (/^\[POINT:/.test(tail)) {
    return { complete: buf.slice(0, idx), partial: tail }
  }
  return { complete: buf, partial: '' }
}

export function processStreamForPoints(
  acc: string,
  chunk: string,
  thumbW: number,
  thumbH: number,
  displays: SerializedDisplay[]
): { acc: string; displayable: string; points: MappedPoint[] } {
  const combined = acc + chunk
  const { complete, partial } = splitPartialTag(combined)
  const { rest, points } = extractCompletePointTags(complete, thumbW, thumbH, displays)
  const displayable = stripPointTags(rest)

  return {
    acc: partial,
    displayable,
    points
  }
}
