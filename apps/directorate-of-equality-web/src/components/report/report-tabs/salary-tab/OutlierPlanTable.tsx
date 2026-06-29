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
}

const o = reportText.salaryTab.outlierTable

export const OutlierPlanTable = ({
  reportId,
  groups,
  outliersPostponed,
  outlierDate,
}: OutlierPlanTableProps) => {
  return (
    <>
      <Text variant="h4" marginBottom={4}>
        {o.heading}
      </Text>
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
