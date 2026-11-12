'use client'

import { parseAsStringLiteral, useQueryState } from 'nuqs'
import { useState } from 'react'

import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Tabs } from '@dmr.is/ui/components/island-is/Tabs'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'
import { Table } from '@dmr.is/ui/components/Tables/Table'

import { LowerSalaryThresholdModal } from '../../components/system-settings/LowerSalaryThresholdModal'
import { MailboxAllowlistModal } from '../../components/system-settings/MailboxAllowlistModal'
import { MailboxAllowlistSection } from '../../components/system-settings/MailboxAllowlistSection'
import { useMailboxAllowlist } from '../../components/system-settings/useMailboxAllowlist'
import {
  type ConfigDto,
  type OneSystemsCheckDto,
} from '../../gen/fetch/types.gen'
import {
  formatDateIS,
  SALARY_DIFFERENCE_THRESHOLD_CONFIG_KEY,
} from '../../lib/constants'
import { systemSettingsText } from '../../lib/text'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { formatPercentValue } from '../../lib/utils'

import { useMutation, useSuspenseQueries } from '@tanstack/react-query'
import { type ColumnDef } from '@tanstack/react-table'

const t = systemSettingsText

const HISTORY_COLUMNS: ColumnDef<ConfigDto>[] = [
  {
    accessorKey: 'value',
    header: t.historyValueLabel,
    enableSorting: false,
    cell: ({ getValue }) => `${formatPercentValue(getValue<string>())}%`,
  },
  {
    accessorKey: 'supersededAt',
    header: t.historyPeriodLabel,
    enableSorting: false,
    cell: ({ getValue }) => {
      const supersededAt = getValue<string | null | undefined>()

      return supersededAt
        ? t.historyUntil(formatDateIS(supersededAt))
        : t.historyCurrent
    },
  },
]

const SETTINGS_TABS = ['launamunur', 'postholf'] as const
type SettingsTab = (typeof SETTINGS_TABS)[number]

/**
 * System-wide settings, one tab each: the allowed base-salary difference
 * between men and women, and who gets notices in their island.is mailbox.
 * The Aðgerðir sidebar shows the open tab's action.
 *
 * Config entries are append-only — an update supersedes the active row rather
 * than overwriting it — so the change log below is simply the key's own history,
 * newest first.
 */
export const SystemSettingsContainer = () => {
  const trpc = useTRPC()
  // The URL (`?tab=postholf`) gives the starting tab and is kept up to date,
  // but the tab itself is plain state. island-ui's Tabs reads `selected` once
  // and reports focus moves through an effect; feeding that straight into the
  // asynchronously updated URL state made the two disagree for a render and
  // flip back and forth. A repeat for the tab already open is ignored.
  const [urlTab, setUrlTab] = useQueryState(
    'tab',
    parseAsStringLiteral(SETTINGS_TABS).withDefault('launamunur'),
  )
  const [activeTab, setActiveTab] = useState<SettingsTab>(urlTab)
  const changeTab = (id: string) => {
    const next = (SETTINGS_TABS as readonly string[]).includes(id)
      ? (id as SettingsTab)
      : 'launamunur'
    if (next === activeTab) return
    setActiveTab(next)
    void setUrlTab(next)
  }
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAllowlistModalOpen, setIsAllowlistModalOpen] = useState(false)
  const allowlist = useMailboxAllowlist()
  const [check, setCheck] = useState<OneSystemsCheckDto | null>(null)
  const checkOneSystems = useMutation({
    ...trpc.noticeIssues.checkOneSystems.mutationOptions(),
    onSuccess: (result) => setCheck(result),
    onError: (error) => {
      const translated = error.data?.translatedMessage
      toast.error(
        translated
          ? `${t.mailbox.checkError} - ${translated}`
          : t.mailbox.checkError,
        { autoClose: 5000 },
      )
    },
  })

  // One `useSuspenseQueries` rather than two `useSuspenseQuery` calls: the
  // second would not be issued until the first suspended and resumed, making the
  // two independent reads of the same key a request waterfall.
  const [{ data: threshold }, { data: history }] = useSuspenseQueries({
    queries: [
      trpc.config.getByKey.queryOptions({
        key: SALARY_DIFFERENCE_THRESHOLD_CONFIG_KEY,
      }),
      trpc.config.getHistoryByKey.queryOptions({
        key: SALARY_DIFFERENCE_THRESHOLD_CONFIG_KEY,
      }),
    ],
  })

  const salaryTab = (
    <Stack space={3}>
      <Box background="white" borderRadius="large" padding={[3, 3, 4]}>
        <Stack space={2}>
          <Text variant="h4" fontWeight="semiBold">
            {t.thresholdHeading}
          </Text>
          <Box>
            <Text variant="eyebrow" color="blue400">
              {t.thresholdLabel}
            </Text>
            <Text variant="h1">{formatPercentValue(threshold.value)}%</Text>
          </Box>
          <Text variant="small">{t.thresholdDescription}</Text>
        </Stack>
      </Box>

      <AlertMessage
        type="warning"
        title={t.irreversibleTitle}
        message={t.irreversibleMessage}
      />

      <Stack space={2}>
        <Text variant="h5" fontWeight="semiBold">
          {t.historyHeading}
        </Text>
        <Table
          columns={HISTORY_COLUMNS}
          data={history}
          noDataMessage={t.historyNoData}
        />
      </Stack>
    </Stack>
  )

  return (
    <GridContainer>
      <GridRow>
        <GridColumn span={['12/12', '12/12', '12/12', '3/12']}>
          <Stack space={2}>
            <Text variant="h5" fontWeight="semiBold">
              {t.actionsHeading}
            </Text>
            {activeTab === 'launamunur' ? (
              <Button
                icon="arrowDown"
                iconType="outline"
                fluid
                size="small"
                variant="utility"
                colorScheme="white"
                onClick={() => setIsModalOpen(true)}
              >
                {t.lowerButton}
              </Button>
            ) : (
              <Button
                icon="pencil"
                iconType="outline"
                fluid
                size="small"
                variant="utility"
                colorScheme="white"
                disabled={!allowlist.loaded}
                onClick={() => setIsAllowlistModalOpen(true)}
              >
                {t.mailbox.editButton}
              </Button>
            )}
            {/* Always rendered, hidden on Launamunur, so the sidebar keeps
                its height and the page does not jump between tabs. */}
            <Box
              aria-hidden={activeTab !== 'postholf'}
              style={{
                visibility: activeTab === 'postholf' ? 'visible' : 'hidden',
              }}
            >
              <Button
                icon="reload"
                iconType="outline"
                fluid
                size="small"
                variant="utility"
                colorScheme="white"
                disabled={activeTab !== 'postholf'}
                loading={checkOneSystems.isPending}
                onClick={() => checkOneSystems.mutate()}
              >
                {t.mailbox.checkButton}
              </Button>
            </Box>
          </Stack>
        </GridColumn>

        <GridColumn span={['12/12', '12/12', '12/12', '9/12']}>
          <Box marginLeft={[0, 0, 0, 2]} marginTop={[3, 3, 3, 0]}>
            <Tabs
              label={t.heroTitle}
              selected={activeTab}
              contentBackground="blue100"
              size="sm"
              onlyRenderSelectedTab
              onChange={changeTab}
              tabs={[
                {
                  id: 'launamunur',
                  label: t.tabSalary,
                  content: <Box paddingTop={3}>{salaryTab}</Box>,
                },
                {
                  id: 'postholf',
                  label: t.tabMailbox,
                  content: (
                    <Box paddingTop={3}>
                      <MailboxAllowlistSection check={check} />
                    </Box>
                  ),
                },
              ]}
            />
          </Box>
        </GridColumn>
      </GridRow>

      <LowerSalaryThresholdModal
        currentValue={threshold.value}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      <MailboxAllowlistModal
        currentValue={allowlist.value}
        isOpen={isAllowlistModalOpen}
        onClose={() => setIsAllowlistModalOpen(false)}
      />
    </GridContainer>
  )
}
