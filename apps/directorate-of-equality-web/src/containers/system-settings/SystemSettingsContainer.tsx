'use client'

import { useState } from 'react'

import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { Table } from '@dmr.is/ui/components/Tables/Table'

import { LowerSalaryThresholdModal } from '../../components/system-settings/LowerSalaryThresholdModal'
import { type ConfigDto } from '../../gen/fetch/types.gen'
import {
  formatDateIS,
  SALARY_DIFFERENCE_THRESHOLD_CONFIG_KEY,
} from '../../lib/constants'
import { systemSettingsText } from '../../lib/text'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { formatPercentValue } from '../../lib/utils'

import { useSuspenseQuery } from '@tanstack/react-query'
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

/**
 * System-wide settings, currently the single knob the directorate owns: the
 * allowed base-salary difference between men and women.
 *
 * Config entries are append-only — an update supersedes the active row rather
 * than overwriting it — so the change log below is simply the key's own history,
 * newest first.
 */
export const SystemSettingsContainer = () => {
  const trpc = useTRPC()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: threshold } = useSuspenseQuery(
    trpc.config.getByKey.queryOptions({
      key: SALARY_DIFFERENCE_THRESHOLD_CONFIG_KEY,
    }),
  )

  const { data: history } = useSuspenseQuery(
    trpc.config.getHistoryByKey.queryOptions({
      key: SALARY_DIFFERENCE_THRESHOLD_CONFIG_KEY,
    }),
  )

  return (
    <GridContainer>
      <GridRow>
        <GridColumn span={['12/12', '12/12', '12/12', '3/12']}>
          <Stack space={2}>
            <Text variant="h5" fontWeight="semiBold">
              {t.actionsHeading}
            </Text>
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
          </Stack>
        </GridColumn>

        <GridColumn span={['12/12', '12/12', '12/12', '9/12']}>
          <Box marginLeft={[0, 0, 0, 2]} marginTop={[3, 3, 3, 0]}>
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
                    <Text variant="h1">
                      {formatPercentValue(threshold.value)}%
                    </Text>
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
          </Box>
        </GridColumn>
      </GridRow>

      <LowerSalaryThresholdModal
        currentValue={threshold.value}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </GridContainer>
  )
}
