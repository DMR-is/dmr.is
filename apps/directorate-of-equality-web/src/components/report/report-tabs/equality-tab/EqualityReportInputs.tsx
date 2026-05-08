import { Box } from '@dmr.is/ui/components/island-is/Box'
import { DatePicker } from '@dmr.is/ui/components/island-is/DatePicker'
import { Input } from '@dmr.is/ui/components/island-is/Input'
export const EqualityReportInputs = () => {
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
          disabled
        />
        <DatePicker
          placeholderText="Gildistími"
          icon={{ name: 'calendar', type: 'outline' }}
          size="sm"
          name="validityPeriod"
          label="Gildistími"
          readOnly
          disabled
        />
      </Box>
      <Box width="half">
        <Input
          label="Ábyrgðaraðili"
          name="reportName"
          size="sm"
          placeholder="Ábyrgðaraðili"
          readOnly
          disabled
        />
      </Box>
    </Box>
  )
}
