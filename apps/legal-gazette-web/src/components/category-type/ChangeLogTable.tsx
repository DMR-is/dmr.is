import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Tag } from '@dmr.is/ui/components/island-is/Tag'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { Table } from '@dmr.is/ui/components/Tables/Table'

import { ChangeLogAction, ChangeLogEntity } from '../../gen/fetch'
import { changeLogActionLabels, changeLogEntityLabels } from './labels'

import { type ColumnDef } from '@tanstack/react-table'

// Structural shape: over tRPC, Date fields arrive serialized as strings.
export type ChangeLogEntry = {
  id: string
  actorId: string
  actorName?: string
  action: ChangeLogAction
  entityType: ChangeLogEntity
  affectedAdvertCount: number
  revertsAuditId?: string
  createdAt: string | Date
}

type Props = {
  entries?: ChangeLogEntry[]
  loading?: boolean
  revertingId?: string
  onRevert: (id: string) => void
}

const formatDate = (value: string | Date) =>
  new Date(value).toLocaleString('is-IS', {
    dateStyle: 'short',
    timeStyle: 'short',
  })

export const ChangeLogTable = ({
  entries,
  loading,
  revertingId,
  onRevert,
}: Props) => {
  const data = entries ?? []
  const revertedIds = new Set(
    data
      .map((e) => e.revertsAuditId)
      .filter((id): id is string => Boolean(id)),
  )

  const columns: ColumnDef<ChangeLogEntry>[] = [
    {
      id: 'createdAt',
      header: 'Dagsetning',
      size: 150,
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      id: 'actor',
      header: 'Notandi',
      cell: ({ row }) => row.original.actorName ?? row.original.actorId,
    },
    {
      id: 'action',
      header: 'Aðgerð',
      size: 160,
      cell: ({ row }) => {
        const isRevert = row.original.action === ChangeLogAction.REVERT
        return (
          <Tag disabled variant={isRevert ? 'red' : 'blue'}>
            {changeLogActionLabels[row.original.action]}
          </Tag>
        )
      },
    },
    {
      id: 'entity',
      header: 'Eining',
      size: 120,
      cell: ({ row }) => changeLogEntityLabels[row.original.entityType],
    },
    {
      id: 'affected',
      header: 'Auglýsingar',
      size: 120,
      cell: ({ row }) =>
        row.original.affectedAdvertCount > 0
          ? row.original.affectedAdvertCount
          : '-',
    },
    {
      id: 'actions',
      header: '',
      size: 160,
      cell: ({ row }) => {
        const entry = row.original
        const isRevert = entry.action === ChangeLogAction.REVERT
        const alreadyReverted = revertedIds.has(entry.id)
        if (isRevert || alreadyReverted) {
          return (
            <Text variant="small" color="dark300">
              {alreadyReverted ? 'Afturkallað' : '-'}
            </Text>
          )
        }
        return (
          <Button
            size="small"
            variant="text"
            icon="reload"
            iconType="outline"
            loading={revertingId === entry.id}
            onClick={() => onRevert(entry.id)}
          >
            Afturkalla
          </Button>
        )
      },
    },
  ]

  return (
    <Table
      columns={columns}
      data={data}
      loading={loading}
      noDataMessage="Engar breytingar skráðar"
    />
  )
}
