'use client'

import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { Table } from '@dmr.is/ui/components/Tables/Table'

import {
  type ConfigDto,
  type OneSystemsCheckDto,
} from '../../gen/fetch/types.gen'
import { formatDateIS } from '../../lib/constants'
import { systemSettingsText } from '../../lib/text'
import { formatNationalId } from '../../lib/utils'
import { parseMailboxAllowlist } from './mailboxAllowlist'
import { MailboxCompanyList } from './MailboxCompanyList'
import { MailboxRecentDeliveries } from './MailboxRecentDeliveries'
import { useMailboxAllowlist } from './useMailboxAllowlist'

import { type ColumnDef } from '@tanstack/react-table'

const t = systemSettingsText.mailbox

const describe = (value: string): string => {
  const parsed = parseMailboxAllowlist(value)
  if (parsed.mode === 'all') return t.modeAll
  if (parsed.mode === 'none') return t.modeNone
  return parsed.nationalIds.map(formatNationalId).join(', ')
}

/** Past values only: the one in force is described by the alert above. */
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
 * What happens to notices on this environment, said once, in an alert whose
 * level matches: every company's mailbox (success), only some or none named
 * (warning), or `ONESYSTEMS_ENABLED` off (error). The flag decides first: off means email for everyone,
 * whatever the setting says. The Breyta action lives in the page's Aðgerðir
 * sidebar while this tab is open.
 */
const checkTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('is-IS', {
    hour: '2-digit',
    minute: '2-digit',
  })

type Props = {
  /** The last "Prófa tengingu" result, from the sidebar action. */
  check?: OneSystemsCheckDto | null
}

export const MailboxAllowlistSection = ({ check }: Props) => {
  const { parsed, isPending, loaded, history, status, statusFailed } =
    useMailboxAllowlist()

  const pastValues = history.filter((row) => !!row.supersededAt)

  const alert = (() => {
    // Either read failing leaves the state unknown: say so, never "nobody".
    if (statusFailed || (!isPending && !loaded)) {
      return { type: 'error' as const, title: t.loadError, message: '' }
    }
    if (isPending || !status) return null
    if (!status.enabled) {
      return {
        type: 'error' as const,
        title: t.titleFlagOff,
        message: t.descriptionFlagOff,
      }
    }
    if (parsed.mode === 'all') {
      return {
        type: 'success' as const,
        title: t.titleAll,
        message: t.descriptionAll,
      }
    }
    if (parsed.mode === 'list') {
      return {
        type: 'warning' as const,
        title: t.titleList(parsed.nationalIds.length),
        message: t.descriptionList,
      }
    }
    return {
      type: 'warning' as const,
      title: t.titleNone,
      message: t.descriptionNone,
    }
  })()

  return (
    <Stack space={3}>
      {alert ? (
        <AlertMessage
          type={alert.type}
          title={alert.title}
          message={alert.message || undefined}
        />
      ) : (
        <SkeletonLoader height={80} />
      )}

      {check && (
        <AlertMessage
          type={check.ok ? 'success' : 'error'}
          title={check.ok ? t.checkOkTitle : t.checkFailedTitle}
          message={
            check.ok
              ? t.checkedAt(checkTime(check.checkedAt))
              : t.checkFailedMessage(
                  check.reason ?? '',
                  checkTime(check.checkedAt),
                )
          }
        />
      )}

      {loaded && parsed.mode === 'list' && (
        <MailboxCompanyList nationalIds={parsed.nationalIds} />
      )}

      <MailboxRecentDeliveries />

      {pastValues.length > 0 && (
        <Stack space={2}>
          <Text variant="h5" fontWeight="semiBold">
            {t.historyHeading}
          </Text>
          <Table columns={HISTORY_COLUMNS} data={pastValues} />
        </Stack>
      )}
    </Stack>
  )
}
