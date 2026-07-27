import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Icon } from '@dmr.is/ui/components/island-is/Icon'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Tag } from '@dmr.is/ui/components/island-is/Tag'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { Table } from '@dmr.is/ui/components/Tables/Table'
import { formatDate } from '@dmr.is/utils-shared/format/date'

import { ChangeLogAction } from '../../gen/fetch'
import * as styles from './CategoryTypeTree.css'
import {
  buildTitleResolver,
  ChangeDetail,
  changeDetails,
  changeLogActionVariants,
  ChangeLogEntry,
  ChangeLogTitle,
  describeChange,
} from './changeLog.utils'
import { changeLogActionLabels } from './labels'

import { type ColumnDef } from '@tanstack/react-table'

export type { ChangeLogEntry } from './changeLog.utils'

type Props = {
  entries?: ChangeLogEntry[]
  titles?: ChangeLogTitle[]
  loading?: boolean
  revertingId?: string
  onRevert: (id: string) => void
}

/** Date and time on separate lines, so the column can stay narrow. */
const LogDate = ({ value }: { value: string | Date }) => {
  const date = new Date(value)
  return (
    <Stack space={0}>
      <Text variant="small" color="dark400">
        {formatDate(date, 'd.MM.yyyy')}
      </Text>
      <Text variant="small" color="dark300">
        {formatDate(date, 'HH:mm')}
      </Text>
    </Stack>
  )
}

/** `muted` marks the previous value, so the new one reads as the current state. */
const DetailValue = ({ value, muted }: { value: string; muted?: boolean }) => (
  <Box className={muted ? styles.logDetailValueMuted : styles.logDetailValue}>
    <Text variant="small" color={muted ? 'dark300' : 'dark400'}>
      {value}
    </Text>
  </Box>
)

const DetailField = ({ detail }: { detail: ChangeDetail }) => (
  <Stack space={1}>
    <Text variant="eyebrow" color="dark400">
      {detail.label}
    </Text>
    {detail.before !== undefined && detail.after !== undefined ? (
      <Inline space={1} alignY="center" flexWrap="wrap">
        <DetailValue value={detail.before} muted />
        <Icon icon="arrowForward" size="small" color="blue400" />
        <DetailValue value={detail.after} />
      </Inline>
    ) : (
      <DetailValue value={detail.value ?? '—'} />
    )}
  </Stack>
)

export const ChangeLogTable = ({
  entries,
  titles,
  loading,
  revertingId,
  onRevert,
}: Props) => {
  const data = entries ?? []
  const resolveTitle = buildTitleResolver(titles ?? [])
  const revertedIds = new Set(
    data.map((e) => e.revertsAuditId).filter((id): id is string => Boolean(id)),
  )

  // A revert cannot itself be reverted, and neither can an entry that has
  // already been undone — the backend rejects both.
  const canRevert = (entry: ChangeLogEntry) =>
    entry.action !== ChangeLogAction.REVERT && !revertedIds.has(entry.id)

  const columns: ColumnDef<ChangeLogEntry>[] = [
    {
      id: 'createdAt',
      header: 'Dags.',
      meta: { fit: true },
      cell: ({ row }) => <LogDate value={row.original.createdAt} />,
    },
    {
      id: 'action',
      header: 'Aðgerð',
      meta: { fit: true },
      cell: ({ row }) => (
        <Tag disabled variant={changeLogActionVariants[row.original.action]}>
          {changeLogActionLabels[row.original.action]}
        </Tag>
      ),
    },
    {
      id: 'change',
      header: 'Breyting',
      meta: { grow: true },
      cell: ({ row }) => {
        const entry = row.original
        const reverted = revertedIds.has(entry.id)
        return (
          <Box className={reverted ? styles.inactive : undefined}>
            <Inline space={1} alignY="center" flexWrap="wrap">
              <Text variant="small" fontWeight="semiBold">
                {entry.actorName ?? entry.actorId}
              </Text>
              <Text variant="small">{describeChange(entry, resolveTitle)}</Text>
              {reverted && (
                <Tag disabled variant="disabled">
                  Afturkallað
                </Tag>
              )}
            </Inline>
          </Box>
        )
      },
    },
  ]

  const renderExpanded = (entry: ChangeLogEntry) => {
    const details = changeDetails(entry, resolveTitle)
    return (
      <Box className={styles.logDetail}>
        <Stack space={3}>
          {details.length ? (
            <Box className={styles.logDetailGrid}>
              {details.map((detail) => (
                <DetailField key={detail.label} detail={detail} />
              ))}
            </Box>
          ) : (
            <Text variant="small" color="dark300">
              Engar frekari upplýsingar skráðar
            </Text>
          )}

          <Box
            display="flex"
            alignItems="center"
            justifyContent="flexEnd"
            flexWrap="wrap"
            columnGap={2}
            rowGap={1}
          >
            {canRevert(entry) ? (
              <Box background="white" borderRadius="large">
                <Button
                  size="small"
                  variant="utility"
                  icon="reload"
                  iconType="outline"
                  loading={revertingId === entry.id}
                  onClick={() => onRevert(entry.id)}
                >
                  Afturkalla
                </Button>
              </Box>
            ) : (
              <Text variant="small" color="dark300">
                {entry.action === ChangeLogAction.REVERT
                  ? 'Afturköllun verður ekki afturkölluð'
                  : 'Þessi breyting hefur verið afturkölluð'}
              </Text>
            )}
          </Box>
        </Stack>
      </Box>
    )
  }

  return (
    <Table
      columns={columns}
      data={data}
      loading={loading}
      layout="auto"
      getRowExpanded={renderExpanded}
      noDataMessage="Engar breytingar skráðar"
    />
  )
}
