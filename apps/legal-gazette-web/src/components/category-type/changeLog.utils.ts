import { TagVariant } from '@dmr.is/ui/components/island-is/Tag'

import { ChangeLogAction, ChangeLogEntity } from '../../gen/fetch'

/** Snapshot values are free-form JSON; only these shapes are rendered. */
type Snapshot = Record<string, unknown> | undefined

// Structural shape: over tRPC, Date fields arrive serialized as strings.
export type ChangeLogEntry = {
  id: string
  actorId: string
  actorName?: string
  action: ChangeLogAction
  entityType: ChangeLogEntity
  entityId?: string
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  affectedAdvertCount: number
  revertsAuditId?: string
  createdAt: string | Date
}

export type ChangeLogTitle = { id: string; title: string }

/**
 * One field of an entry. Either a transition (`before` → `after`) or a single
 * `value`, so the UI can render arrows only where something actually changed.
 */
export type ChangeDetail = {
  label: string
  value?: string
  before?: string
  after?: string
}

/** Resolves an entity id to its title, falling back to a short id. */
export type ResolveTitle = (id?: string) => string

export const buildTitleResolver = (titles: ChangeLogTitle[]): ResolveTitle => {
  const byId = new Map(titles.map((entry) => [entry.id, entry.title]))
  return (id) => {
    if (!id) return 'óþekkt'
    return byId.get(id) ?? `${id.slice(0, 8)}…`
  }
}

/**
 * Severity-grouped rather than one colour per action: additive, edits, links,
 * broad-impact and destructive changes are what the reader needs to tell apart.
 */
export const changeLogActionVariants: Record<ChangeLogAction, TagVariant> = {
  [ChangeLogAction.CREATE]: 'mint',
  [ChangeLogAction.UPDATE]: 'blue',
  [ChangeLogAction.SETACTIVE]: 'yellow',
  [ChangeLogAction.ATTACH]: 'purple',
  [ChangeLogAction.DETACH]: 'purple',
  [ChangeLogAction.MOVE]: 'warn',
  [ChangeLogAction.DELETE]: 'red',
  [ChangeLogAction.REVERT]: 'dark',
}

const string = (snapshot: Snapshot, key: string): string | undefined => {
  const value = snapshot?.[key]
  return typeof value === 'string' ? value : undefined
}

const boolean = (snapshot: Snapshot, key: string): boolean | undefined => {
  const value = snapshot?.[key]
  return typeof value === 'boolean' ? value : undefined
}

const quote = (value: string) => `„${value}“`

/** Accusative — „flokkinn X", „tegundina X". */
const accusative = (entityType: ChangeLogEntity) =>
  entityType === ChangeLogEntity.CATEGORY ? 'flokkinn' : 'tegundina'

/** Dative — „flokknum X", „tegundinni X". */
const dative = (entityType: ChangeLogEntity) =>
  entityType === ChangeLogEntity.CATEGORY ? 'flokknum' : 'tegundinni'

/**
 * Title of the entity an entry is about: the current name when it still
 * exists, otherwise whichever snapshot captured it before deletion.
 */
const entityTitle = (entry: ChangeLogEntry, resolve: ResolveTitle): string => {
  const snapshotTitle =
    string(entry.after, 'title') ?? string(entry.before, 'title')
  if (entry.entityId) {
    const resolved = resolve(entry.entityId)
    // The resolver falls back to a truncated id; a snapshot name beats that.
    if (!resolved.endsWith('…')) return resolved
  }
  return snapshotTitle ?? 'óþekkt'
}

const connection = (snapshot: Snapshot, resolve: ResolveTitle) => ({
  type: resolve(string(snapshot, 'typeId')),
  category: resolve(string(snapshot, 'categoryId')),
})

/**
 * What an entry did, as a predicate to follow the actor's name:
 * „Jón Bjarni endurnefndi flokkinn „Skiptalok" í „Skiptalok 2024"".
 */
export const describeChange = (
  entry: ChangeLogEntry,
  resolve: ResolveTitle,
): string => {
  const title = entityTitle(entry, resolve)

  switch (entry.action) {
    case ChangeLogAction.CREATE:
      return `stofnaði ${accusative(entry.entityType)} ${quote(title)}`

    case ChangeLogAction.DELETE:
      return `eyddi ${dative(entry.entityType)} ${quote(title)}`

    case ChangeLogAction.UPDATE: {
      const before = string(entry.before, 'title')
      const after = string(entry.after, 'title')
      if (before && after && before !== after) {
        return `endurnefndi ${accusative(entry.entityType)} ${quote(
          before,
        )} í ${quote(after)}`
      }
      return `uppfærði ${accusative(entry.entityType)} ${quote(title)}`
    }

    case ChangeLogAction.SETACTIVE: {
      const active = boolean(entry.after, 'active')
      const verb = active ? 'virkjaði' : 'óvirkjaði'
      return `${verb} ${accusative(entry.entityType)} ${quote(title)}`
    }

    case ChangeLogAction.ATTACH: {
      const { type, category } = connection(entry.after, resolve)
      return `tengdi tegundina ${quote(type)} við flokkinn ${quote(category)}`
    }

    case ChangeLogAction.DETACH: {
      const { type, category } = connection(entry.before, resolve)
      return `aftengdi tegundina ${quote(type)} frá flokknum ${quote(category)}`
    }

    case ChangeLogAction.MOVE: {
      const toType = string(entry.after, 'toTypeId')
      const toCategory = string(entry.after, 'toCategoryId')
      const targets = [
        toType ? `tegundina ${quote(resolve(toType))}` : undefined,
        toCategory ? `flokkinn ${quote(resolve(toCategory))}` : undefined,
      ].filter(Boolean)
      return `færði ${entry.affectedAdvertCount} auglýsingar úr ${dative(
        entry.entityType,
      )} ${quote(title)} í ${targets.join(' og ')}`
    }

    case ChangeLogAction.REVERT:
      return `afturkallaði breytingu á ${dative(entry.entityType)} ${quote(
        title,
      )}`

    default:
      return 'gerði óþekkta breytingu'
  }
}

const activeLabel = (active?: boolean) =>
  active === undefined ? '—' : active ? 'Virkt' : 'Óvirkt'

/**
 * Field-level detail for the expanded row. MOVE snapshots also carry the full
 * per-advert undo payload, which is deliberately not rendered.
 */
export const changeDetails = (
  entry: ChangeLogEntry,
  resolve: ResolveTitle,
): ChangeDetail[] => {
  switch (entry.action) {
    case ChangeLogAction.ATTACH:
    case ChangeLogAction.DETACH: {
      const snapshot =
        entry.action === ChangeLogAction.ATTACH ? entry.after : entry.before
      const { type, category } = connection(snapshot, resolve)
      return [
        { label: 'Tegund', value: type },
        { label: 'Flokkur', value: category },
      ]
    }

    case ChangeLogAction.MOVE: {
      const filter = entry.before?.['filter'] as
        | Record<string, unknown>
        | undefined
      const fromType = string(filter, 'fromTypeId')
      const fromCategory = string(filter, 'fromCategoryId')
      const toType = string(entry.after, 'toTypeId')
      const toCategory = string(entry.after, 'toCategoryId')
      return [
        { label: 'Auglýsingar', value: String(entry.affectedAdvertCount) },
        ...(toType
          ? [
              {
                label: 'Tegund',
                before: resolve(fromType),
                after: resolve(toType),
              },
            ]
          : [{ label: 'Tegund', value: resolve(fromType) }]),
        ...(toCategory
          ? [
              {
                label: 'Flokkur',
                before: fromCategory ? resolve(fromCategory) : 'Allir',
                after: resolve(toCategory),
              },
            ]
          : fromCategory
            ? [{ label: 'Flokkur', value: resolve(fromCategory) }]
            : []),
      ]
    }

    default: {
      // Title/slug/active are the only stored fields for category and type.
      const fields: { key: string; label: string }[] = [
        { key: 'title', label: 'Heiti' },
        { key: 'slug', label: 'Slóð' },
      ]
      const details: ChangeDetail[] = []

      fields.forEach(({ key, label }) => {
        const before = string(entry.before, key)
        const after = string(entry.after, key)
        if (before === after) return
        if (before && after) {
          details.push({ label, before, after })
        } else {
          details.push({ label, value: after ?? before ?? '—' })
        }
      })

      const beforeActive = boolean(entry.before, 'active')
      const afterActive = boolean(entry.after, 'active')
      if (beforeActive !== afterActive) {
        details.push(
          beforeActive === undefined || afterActive === undefined
            ? {
                label: 'Staða',
                value: activeLabel(afterActive ?? beforeActive),
              }
            : {
                label: 'Staða',
                before: activeLabel(beforeActive),
                after: activeLabel(afterActive),
              },
        )
      }

      return details
    }
  }
}
