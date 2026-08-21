import { AlertMessage } from '@dmr.is/ui/components/island-is/AlertMessage'
import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { type ReportOutlierGroupDto } from '../../../../gen/fetch'
import { reportText } from '../../../../lib/text'
import { OutlierGroupTable } from './OutlierGroupTable'
import { OutlierInputForm } from './OutlierInputForm'

interface OutlierPlanTableProps {
  reportId: string
  groups: ReportOutlierGroupDto[]
  outliersPostponed?: boolean
  outlierDate?: Date
  /**
   * Size of the lágmarksmengi — the employees this plan must account for.
   * Rendered as a subtitle rather than as a StatisticCard beside the gap
   * figures, because it counts rows in the table below rather than measuring
   * anything. Undefined for a report with no computed result, which renders no
   * subtitle rather than a zero.
   */
  minimumSetSize?: number
}

const o = reportText.salaryTab.outlierTable

export const OutlierPlanTable = ({
  reportId,
  groups,
  outliersPostponed,
  outlierDate,
  minimumSetSize,
}: OutlierPlanTableProps) => {
  const t = reportText.salaryTab
  return (
    <>
      <Text variant="h4" marginBottom={minimumSetSize == null ? 4 : 1}>
        {o.heading}
      </Text>
      {minimumSetSize != null && (
        <Box marginBottom={4}>
          <Text variant="small" color="dark300">
            {`${t.minimumSetLabel}: ${
              minimumSetSize === 0 ? t.minimumSetNone : minimumSetSize
            }`}
          </Text>
        </Box>
      )}
      {outliersPostponed && (
        <Box marginBottom={2}>
          <Stack space={2}>
            <AlertMessage
              type="warning"
              title={reportText.salaryTab.outliersPostponedTitle}
              message={reportText.salaryTab.outliersPostponedMessage}
            />
            <OutlierInputForm outlierDate={outlierDate} />
          </Stack>
        </Box>
      )}
      {groups.map((group) => (
        <OutlierGroupTable key={group.id} reportId={reportId} group={group} />
      ))}
    </>
  )
}
