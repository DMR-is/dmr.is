'use client'

import { useMemo, useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { LinkV2 } from '@dmr.is/ui/components/island-is/LinkV2'
import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'
import { Table } from '@dmr.is/ui/components/Tables/Table'

import { ReconcileDeliveryModal } from '../../components/notice-issues/ReconcileDeliveryModal'
import {
  type NoticeIssueDeliveryDto,
  type NoticeIssueDto,
  type ReminderDeliveryIssueDto,
} from '../../gen/fetch/types.gen'
import { formatDateIS } from '../../lib/constants'
import { noticeIssuesText } from '../../lib/text'
import { useTRPC } from '../../lib/trpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'

const t = noticeIssuesText

const deliveryLabel = (delivery?: NoticeIssueDeliveryDto | null): string => {
  if (!delivery) return t.noDelivery
  const status = t.deliveryStatusLabels[delivery.status] ?? delivery.status
  if (delivery.inProgress) return `${status} (${t.inProgressNote})`
  if (delivery.exhausted) return `${status} (${t.exhaustedNote})`
  return status
}

const Section = ({
  heading,
  description,
  shown,
  total,
  children,
}: {
  heading: string
  description: string
  /** Rows listed, and how many there are: the API returns at most 100. */
  shown: number
  total: number
  children: React.ReactNode
}) => (
  <Box background="white" borderRadius="large" padding={[3, 3, 4]}>
    <Stack space={2}>
      <Text variant="h4" fontWeight="semiBold">
        {heading}
      </Text>
      <Text variant="small">{description}</Text>
      {total > shown && (
        <Text variant="small" fontWeight="semiBold">
          {t.shownOf(shown, total)}
        </Text>
      )}
      {children}
    </Stack>
  </Box>
)

/**
 * Notices that did not reach the company. Failed ones carry the act that
 * fixes them: a retry, or, when the letter may already be in the mailbox, a
 * reconcile against One. Held ones are shown for their reason only; they go
 * by themselves.
 */
export const NoticeIssuesContainer = () => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [reconciling, setReconciling] = useState<NoticeIssueDeliveryDto | null>(
    null,
  )

  // Not a suspense query: one would run during the server render, which has
  // no session, and log a 401 on every load before falling back to the client.
  const { data, isPending, isError } = useQuery(
    trpc.noticeIssues.getIssues.queryOptions(),
  )

  const retry = useMutation({
    ...trpc.noticeIssues.retryNotice.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries(trpc.noticeIssues.getIssues.queryFilter())
      toast.success(t.retrySuccess)
    },
    onError: (error) => {
      const translated = error.data?.translatedMessage
      toast.error(
        translated ? `${t.retryError} - ${translated}` : t.retryError,
        {
          autoClose: 5000,
        },
      )
    },
  })

  const pendingRetryId = retry.isPending ? retry.variables?.id : undefined

  const noticeColumns = (withAction: boolean): ColumnDef<NoticeIssueDto>[] => [
    {
      accessorKey: 'kind',
      header: t.columns.kind,
      enableSorting: false,
      cell: ({ row }) => t.kindLabels[row.original.kind] ?? row.original.kind,
    },
    {
      accessorKey: 'reportIdentifier',
      header: t.columns.report,
      enableSorting: false,
      cell: ({ row }) => (
        <LinkV2 href={`/yfirlit/${row.original.reportId}`} underline="normal">
          {row.original.reportIdentifier ?? row.original.reportId.slice(0, 8)}
        </LinkV2>
      ),
    },
    {
      accessorKey: 'companyName',
      header: t.columns.company,
      enableSorting: false,
      cell: ({ row }) => row.original.companyName ?? '',
    },
    {
      accessorKey: 'lastError',
      header: t.columns.reason,
      enableSorting: false,
      cell: ({ row }) => row.original.lastError ?? '',
    },
    {
      accessorKey: 'processedAt',
      header: t.columns.date,
      enableSorting: false,
      cell: ({ row }) =>
        formatDateIS(row.original.processedAt ?? row.original.createdAt),
    },
    {
      accessorKey: 'delivery',
      header: t.columns.mailbox,
      enableSorting: false,
      cell: ({ row }) => deliveryLabel(row.original.delivery),
    },
    ...(withAction
      ? [
          {
            id: 'action',
            header: t.columns.action,
            enableSorting: false,
            cell: ({ row }: { row: { original: NoticeIssueDto } }) => {
              const delivery = row.original.delivery
              if (delivery?.inProgress) return t.inProgressNote
              if (delivery?.needsReconciling) {
                return (
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => setReconciling(delivery)}
                  >
                    {t.reconcileButton}
                  </Button>
                )
              }
              return (
                <Button
                  size="small"
                  variant="text"
                  loading={pendingRetryId === row.original.id}
                  // One retry at a time: a second click would make the first
                  // row's button clickable again while its request runs.
                  disabled={!!pendingRetryId}
                  onClick={() => retry.mutate({ id: row.original.id })}
                >
                  {t.retryButton}
                </Button>
              )
            },
          } satisfies ColumnDef<NoticeIssueDto>,
        ]
      : []),
  ]

  // Rebuilt only when a retry starts or ends, not on every render.
  const failedColumns = useMemo(() => noticeColumns(true), [pendingRetryId])
  const overdueColumns = useMemo(() => noticeColumns(false), [])

  const reminderColumns = useMemo<ColumnDef<ReminderDeliveryIssueDto>[]>(
    () => [
      {
        id: 'kind',
        header: t.columns.kind,
        enableSorting: false,
        cell: ({ row }) =>
          t.kindLabels[row.original.delivery.kind] ??
          row.original.delivery.kind,
      },
      {
        accessorKey: 'companyName',
        header: t.columns.company,
        enableSorting: false,
        cell: ({ row }) => row.original.companyName ?? '',
      },
      {
        id: 'date',
        header: t.columns.date,
        enableSorting: false,
        cell: ({ row }) =>
          row.original.delivery.lastAttemptAt
            ? formatDateIS(row.original.delivery.lastAttemptAt)
            : '',
      },
      {
        id: 'mailbox',
        header: t.columns.mailbox,
        enableSorting: false,
        cell: ({ row }) => deliveryLabel(row.original.delivery),
      },
      {
        id: 'action',
        header: t.columns.action,
        enableSorting: false,
        cell: ({ row }) => {
          const delivery = row.original.delivery
          if (delivery.inProgress) return t.inProgressNote
          if (delivery.needsReconciling) {
            return (
              <Button
                size="small"
                variant="text"
                onClick={() => setReconciling(delivery)}
              >
                {t.reconcileButton}
              </Button>
            )
          }
          return t.reminderExhaustedNote
        },
      },
    ],
    [],
  )

  if (isPending) {
    return (
      <GridContainer>
        <SkeletonLoader repeat={3} height={160} space={3} />
      </GridContainer>
    )
  }

  if (isError) {
    return (
      <GridContainer>
        <AlertMessage type="error" message={t.loadError} />
      </GridContainer>
    )
  }

  return (
    <GridContainer>
      <GridRow>
        <GridColumn span="12/12">
          <Stack space={3}>
            <Section
              heading={t.failedHeading}
              description={t.failedDescription}
              shown={data?.failed.length ?? 0}
              total={data?.failedTotal ?? 0}
            >
              <Table
                columns={failedColumns}
                data={data?.failed ?? []}
                noDataMessage={t.failedNoData}
              />
            </Section>
            <Section
              heading={t.overdueHeading}
              description={t.overdueDescription}
              shown={data?.overdue.length ?? 0}
              total={data?.overdueTotal ?? 0}
            >
              <Table
                columns={overdueColumns}
                data={data?.overdue ?? []}
                noDataMessage={t.overdueNoData}
              />
            </Section>
            <Section
              heading={t.remindersHeading}
              description={t.remindersDescription}
              shown={data?.reminders.length ?? 0}
              total={data?.remindersTotal ?? 0}
            >
              <Table
                columns={reminderColumns}
                data={data?.reminders ?? []}
                noDataMessage={t.remindersNoData}
              />
            </Section>
          </Stack>
        </GridColumn>
      </GridRow>

      <ReconcileDeliveryModal
        delivery={reconciling}
        onClose={() => setReconciling(null)}
      />
    </GridContainer>
  )
}
