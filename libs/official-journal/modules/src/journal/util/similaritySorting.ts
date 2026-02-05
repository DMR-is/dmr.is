export type Id = string | number

export function scoreBuckets(
  buckets: Record<string, Array<Id | { id: Id }>>,
  weights: Record<string, number>,
): Map<string, number> {
  const scores = new Map<string, number>()

  const bump = (raw: Id | { id: Id }, w: number) => {
    const id = typeof raw === 'object' && raw !== null ? (raw as any).id : raw
    if (id == null) return
    const key = String(id)
    scores.set(key, (scores.get(key) ?? 0) + w)
  }

  for (const [bucketName, list] of Object.entries(buckets)) {
    const w = weights[bucketName] ?? 0
    if (!w || !Array.isArray(list)) continue
    for (const item of list) bump(item, w)
  }

  return scores
}

// Sort already-fetched rows by score (desc), then tie-breaker (desc), and slice.
export function sortByScoreAndSlice<T extends { id: Id }>(
  rows: T[],
  scores: Map<string, number>,
  limit: number,
  getTieBreaker?: (row: T) => number | Date | null | undefined,
): T[] {
  const getScore = (row: T) => scores.get(String(row.id)) ?? 0
  const tie = (row: T): number => {
    if (!getTieBreaker) return 0
    const v = getTieBreaker(row)
    if (v == null) return 0
    return v instanceof Date ? v.getTime() : Number(v) || 0
  }

  const filtered = rows.filter((r) => r && r.id != null)

  filtered.sort((a, b) => {
    const sa = getScore(a)
    const sb = getScore(b)
    if (sb !== sa) return sb - sa
    return tie(b) - tie(a) // newer/larger first
  })

  return filtered.slice(0, Math.max(0, limit))
}
