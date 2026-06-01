import { Box } from '@dmr.is/ui/components/island-is/Box'
import { DatePicker } from '@dmr.is/ui/components/island-is/DatePicker'
import { Input } from '@dmr.is/ui/components/island-is/Input'

import { reportText } from '../../../../lib/text'
interface EqualityReportInputsProps {
  supervisor?: string
  approvalDate?: Date
  validityPeriod?: Date
}

export const EqualityReportInputs = ({
  supervisor,
  approvalDate,
  validityPeriod,
}: EqualityReportInputsProps) => {
  return (
    <Box>
      <Box display="flex" columnGap={2} marginBottom={2}>
        <DatePicker
          placeholderText={reportText.equalityTab.approvedDateLabel}
          icon={{ name: 'calendar', type: 'outline' }}
          size="sm"
          name="planApprovalDate"
          label={reportText.equalityTab.approvedDateLabel}
          readOnly
          selected={approvalDate}
        />
        <DatePicker
          placeholderText={reportText.equalityTab.expiryLabel}
          icon={{ name: 'calendar', type: 'outline' }}
          size="sm"
          name="validityPeriod"
          label={reportText.equalityTab.expiryLabel}
          readOnly
          selected={validityPeriod}
        />
      </Box>
      <Box width="half">
        <Input
          label={reportText.equalityTab.responsibleLabel}
          name="reportName"
          size="sm"
          placeholder={reportText.equalityTab.responsibleLabel}
          readOnly
          value={supervisor}
        />
      </Box>
    </Box>
  )
}
