/**
 * The mutation a single sync command performs on its collection row. The body
 * of `POST …/draft/sync` is per-collection arrays of tagged commands; the
 * server applies them atomically. Flat + tagged (not a discriminated union) to
 * keep the generated client clean — see `ReportTimelineItemDto` for the same
 * convention.
 */
export enum SyncMethodEnum {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  REMOVE = 'REMOVE',
}
