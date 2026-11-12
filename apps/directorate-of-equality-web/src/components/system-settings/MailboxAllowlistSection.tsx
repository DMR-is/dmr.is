'use client'

import { useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { Table } from '@dmr.is/ui/components/Tables/Table'

import { type ConfigDto } from '../../gen/fetch/types.gen'
import { formatDateIS, MAILBOX_ALLOWLIST_CONFIG_KEY } from '../../lib/constants'
import { systemSettingsText } from '../../lib/text'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { formatNationalId } from '../../lib/utils'
import { parseMailboxAllowlist } from './mailboxAllowlist'
import { MailboxAllowlistModal } from './MailboxAllowlistModal'

import { type ColumnDef } from '@tanstack/react-table'

const t = systemSettingsText.mailbox

const describe = (value: string): string => {
  const parsed = parseMailboxAllowlist(value)
  if (parsed.mode === 'all') return t.modeAll
  if (parsed.mode === 'none') return t.modeNone
  return parsed.nationalIds.map(formatNationalId).join(', ')
}

const HISTORY_COLUMNS: ColumnDef<ConfigDto>[] = [
  {
    accessorKey: 'value',
    header: t.historyValueLabel,
    enableSorting: false,
    cell: ({ getValue }) => describe(getValue<string>()),
  },
  {
    accessorKey: 'supersededAt',
    header: systemSettingsText.historyPeriodLabel,
    enableSorting: false,
    cell: ({ getValue }) => {
      const supersededAt = getValue<string | null | undefined>()
      return supersededAt
        ? systemSettingsText.historyUntil(formatDateIS(supersededAt))
        : systemSettingsText.historyCurrent
    },
  },
]

/**
 * Who gets notices in their island.is mailbox. Read with `useQuery`, not
 * suspense, so a failure here leaves the rest of the page usable. A missing
 * row (404) reads as nobody, as it does in the API; any other failure says so
 * rather than showing "nobody" for a value it never read, and the edit stays
 * closed until the value has loaded.
 */
export const MailboxAllowlistSection = () => {
  const trpc = useTRPC()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const {
    data: current,
    isPending,
    error,
  } = useQuery(
    trpc.config.getByKey.queryOptions({ key: MAILBOX_ALLOWLIST_CONFIG_KEY }),
  )
  const { data: history } = useQuery(
    trpc.config.getHistoryByKey.queryOptions({
      key: MAILBOX_ALLOWLIST_CONFIG_KEY,
    }),
  )

  const missing = error?.data?.httpStatus === 404
  const loaded = !!current || missing
  const value = current?.value ?? 'none'
  const parsed = parseMailboxAllowlist(value)

  return (
    <Box background="white" borderRadius="large" padding={[3, 3, 4]}>
      <Stack space={2}>
        <Inline justifyContent="spaceBetween" alignY="center">
          <Text variant="h4" fontWeight="semiBold">
            {t.heading}
          </Text>
          <Button
            size="small"
            variant="utility"
            icon="pencil"
            iconType="outline"
            disabled={!loaded}
            onClick={() => setIsModalOpen(true)}
          >
            {t.editButton}
          </Button>
        </Inline>
        <Text variant="small">{t.description}</Text>
        {isPending ? (
          <SkeletonLoader height={56} />
        ) : !loaded ? (
          <AlertMessage type="error" message={t.loadError} />
        ) : (
          <Box>
            <Text variant="eyebrow" color="blue400">
              {t.currentLabel}
            </Text>
            <Text variant="h3">
              {parsed.mode === 'list'
                ? t.modeListCount(parsed.nationalIds.length)
                : describe(value)}
            </Text>
            {parsed.mode === 'list' && <Text>{describe(value)}</Text>}
          </Box>
        )}
        <Text variant="small">{t.flagNote}</Text>
        <Table
          columns={HISTORY_COLUMNS}
          data={history ?? []}
          noDataMessage={systemSettingsText.historyNoData}
        />
      </Stack>

      <MailboxAllowlistModal
        currentValue={value}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </Box>
  )
}
