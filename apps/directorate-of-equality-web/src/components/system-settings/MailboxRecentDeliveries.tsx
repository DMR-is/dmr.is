'use client'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { Table } from '@dmr.is/ui/components/Tables/Table'

import { type RecentDeliveryDto } from '../../gen/fetch/types.gen'
import { formatDateIS } from '../../lib/constants'
import { systemSettingsText } from '../../lib/text'
import { useTRPC } from '../../lib/trpc/client/trpc'

import { type ColumnDef } from '@tanstack/react-table'

const t = systemSettingsText.mailbox

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString('is-IS', {
    hour: '2-digit',
    minute: '2-digit',
  })

const COLUMNS: ColumnDef<RecentDeliveryDto>[] = [
  {
    id: 'kind',
    header: t.recentColumns.kind,
    enableSorting: false,
    cell: ({ row }) =>
      t.mailboxKindLabels[row.original.delivery.kind] ??
      row.original.delivery.kind,
  },
  {
    accessorKey: 'companyName',
    header: t.recentColumns.company,
    enableSorting: false,
    cell: ({ row }) => row.original.companyName ?? '',
  },
  {
    id: 'sentAt',
    header: t.recentColumns.sentAt,
    enableSorting: false,
    cell: ({ row }) => {
      const sentAt = row.original.delivery.sentAt
      return sentAt ? `${formatDateIS(sentAt)} kl. ${time(sentAt)}` : ''
    },
  },
  {
    id: 'document',
    header: t.recentColumns.document,
    enableSorting: false,
    cell: ({ row }) => row.original.delivery.oneDocumentItemId ?? '',
  },
]

/** The latest letters that reached a mailbox, whatever the current setting. */
export const MailboxRecentDeliveries = () => {
  const trpc = useTRPC()
  const { data } = useQuery(trpc.noticeIssues.getRecent.queryOptions())

  return (
    <Stack space={2}>
      <Text variant="h5" fontWeight="semiBold">
        {t.recentHeading}
      </Text>
      <Table
        columns={COLUMNS}
        data={data ?? []}
        noDataMessage={t.recentNoData}
      />
    </Stack>
  )
}
