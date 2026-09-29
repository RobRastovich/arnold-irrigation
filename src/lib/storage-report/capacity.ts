import type { CapacityPoint } from './types'

function sortedByElevation(points: CapacityPoint[]): CapacityPoint[] {
  return [...points].sort((a, b) => a.elevation - b.elevation)
}

/** Excel LOOKUP: last row whose first column is ≤ lookup (table must be ascending). */
export function lookupLastLe(values: { key: number; value: number }[], lookup: number): number {
  let found: number | null = null
  for (const row of values) {
    if (row.key <= lookup) found = row.value
    else break
  }
  if (found === null) return values[0]?.value ?? 0
  return found
}

/**
 * Stage → contents: LOOKUP at 0.1-foot table points plus linear interpolation,
 * matching raw_data columns Y / AA / AC.
 */
export function contentsFromStage(stage: number, points: CapacityPoint[]): number {
  if (!points.length) return 0
  const table = sortedByElevation(points)
  const tenth = Math.floor(stage * 10 + 1e-9) / 10
  const rows = table.map((p) => ({ key: p.elevation, value: p.acreFeet }))
  const lo = lookupLastLe(rows, tenth)
  const hi = lookupLastLe(rows, tenth + 0.1)
  const frac = (stage - tenth) / 0.1
  return lo + (hi - lo) * frac
}

/** Average surface acres from contents LOOKUP (Wickiup cap_tables F:G). */
export function surfaceAcresFromContents(contentsAf: number, points: CapacityPoint[]): number {
  const withArea = points
    .filter((p) => p.surfaceAcres != null)
    .sort((a, b) => a.acreFeet - b.acreFeet)
    .map((p) => ({ key: p.acreFeet, value: p.surfaceAcres as number }))
  if (!withArea.length) return 0
  return lookupLastLe(withArea, contentsAf)
}

export function averageSurfaceAcres(
  startContentsAf: number,
  endContentsAf: number,
  points: CapacityPoint[]
): number {
  return (
    (surfaceAcresFromContents(startContentsAf, points) +
      surfaceAcresFromContents(endContentsAf, points)) /
    2
  )
}
