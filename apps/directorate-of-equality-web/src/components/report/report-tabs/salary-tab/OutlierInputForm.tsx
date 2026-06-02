import { Box } from '@dmr.is/ui/components/island-is/Box'
import { DatePicker } from '@dmr.is/ui/components/island-is/DatePicker'

import { reportText } from '../../../../lib/text'
interface OutlierInputFormProps {
  outlierDate?: Date
}

export const OutlierInputForm = ({ outlierDate }: OutlierInputFormProps) => {
  if (!outlierDate) return null
  return (
    <Box style={{ maxWidth: 390 }}>
      <DatePicker
        readOnly
        placeholderText={reportText.salaryTab.remedyDeadlinePlaceholder}
        icon={{ name: 'calendar', type: 'outline' }}
        size="sm"
        name="outlierCorrectionDate"
        label={reportText.salaryTab.remedyDeadlineLabel}
        selected={outlierDate}
      />
    </Box>
  )
}
