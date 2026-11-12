'use client'

import { useState } from 'react'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Tag } from '@dmr.is/ui/components/island-is/Tag'
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

/** Past values only: the one in force is shown above the table. */
const HISTORY_COLUMNS: ColumnDef<ConfigDto>[] = [
  {
    accessorKey: 'value',
    header: t.historyValueLabel,
    enableSorting: false,
    cell: ({ getValue }) => describe(getValue<string>()),
  },
  {
    accessorKey: 'supersededAt',
    header: t.historyUntilLabel,
    enableSorting: false,
    cell: ({ getValue }) => {
      const supersededAt = getValue<string | null | undefined>()
      return supersededAt ? formatDateIS(supersededAt) : ''
    },
  },
]

/**
 * Who gets notices in their island.is mailbox, and whether this environment
 * sends to mailboxes at all (`ONESYSTEMS_ENABLED`, read from the API so the
 * tag shows what the dispatcher acts on).
 *
 * Read with `useQuery`, not suspense, so a failure here leaves the rest of the
 * page usable. A missing row (404) reads as nobody, as it does in the API; any
 * other failure says so rather than showing "nobody" for a value it never
 * read, and the edit stays closed until the value has loaded.
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
  const { data: status } = useQuery(
    trpc.config.getOneSystemsStatus.queryOptions(),
  )

  const missing = error?.data?.httpStatus === 404
  const loaded = !!current || missing
  const value = current?.value ?? 'none'
  const parsed = parseMailboxAllowlist(value)
  const pastValues = (history ?? []).filter((row) => !!row.supersededAt)

  return (
    <Box background="white" borderRadius="large" padding={[3, 3, 4]}>
      <Stack space={2}>
        <Inline justifyContent="spaceBetween" alignY="center">
          <Inline space={2} alignY="center">
            <Text variant="h4" fontWeight="semiBold">
              {t.heading}
            </Text>
            {status && (
              <Tag variant={status.enabled ? 'mint' : 'red'} disabled>
                {status.enabled ? t.flagOn : t.flagOff}
              </Tag>
            )}
          </Inline>
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

        {status && !status.enabled && (
          <AlertMessage type="info" message={t.flagOffNote} />
        )}

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

        {pastValues.length > 0 && (
          <Stack space={1}>
            <Text variant="h5" fontWeight="semiBold">
              {t.historyHeading}
            </Text>
            <Table columns={HISTORY_COLUMNS} data={pastValues} />
          </Stack>
        )}
      </Stack>

      <MailboxAllowlistModal
        currentValue={value}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </Box>
  )
}
