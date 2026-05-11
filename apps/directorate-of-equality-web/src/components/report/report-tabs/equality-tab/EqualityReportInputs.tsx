import { Box } from '@dmr.is/ui/components/island-is/Box'
import { DatePicker } from '@dmr.is/ui/components/island-is/DatePicker'
import { Input } from '@dmr.is/ui/components/island-is/Input'

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
          placeholderText="Dagsetning samþykktar"
          icon={{ name: 'calendar', type: 'outline' }}
          size="sm"
          name="planApprovalDate"
          label="Dagsetning samþykktar"
          readOnly
          selected={approvalDate}
        />
        <DatePicker
          placeholderText="Gildistími"
          icon={{ name: 'calendar', type: 'outline' }}
          size="sm"
          name="validityPeriod"
          label="Gildistími"
          readOnly
          selected={validityPeriod}
        />
      </Box>
      <Box width="half">
        <Input
          label="Ábyrgðaraðili"
          name="reportName"
          size="sm"
          placeholder="Ábyrgðaraðili"
          readOnly
          value={supervisor}
        />
      </Box>
    </Box>
  )
}
