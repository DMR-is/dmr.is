'use client'

import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Tag } from '@dmr.is/ui/components/island-is/Tag'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { Table } from '@dmr.is/ui/components/Tables/Table'

import { type ConfigDto } from '../../gen/fetch/types.gen'
import { formatDateIS } from '../../lib/constants'
import { systemSettingsText } from '../../lib/text'
import { formatNationalId } from '../../lib/utils'
import { parseMailboxAllowlist } from './mailboxAllowlist'
import { useMailboxAllowlist } from './useMailboxAllowlist'

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
 * tag shows what the dispatcher acts on). The Breyta action lives in the
 * page's Aðgerðir sidebar while this tab is open.
 */
export const MailboxAllowlistSection = () => {
  const { value, parsed, isPending, loaded, history, status } =
    useMailboxAllowlist()

  const pastValues = history.filter((row) => !!row.supersededAt)

  // What actually happens on this environment: the flag first, since off
  // means email for everyone whatever the setting says.
  const description = !status
    ? t.description
    : !status.enabled
      ? t.descriptionFlagOff
      : !loaded
        ? t.description
        : parsed.mode === 'all'
          ? t.descriptionAll
          : parsed.mode === 'list'
            ? t.descriptionList(parsed.nationalIds.length)
            : t.descriptionNone

  return (
    <Box background="white" borderRadius="large" padding={[3, 3, 4]}>
      <Stack space={2}>
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
        <Text variant="small">{description}</Text>

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
    </Box>
  )
}
