import { Box } from '@dmr.is/ui/components/island-is/Box'
import { DatePicker } from '@dmr.is/ui/components/island-is/DatePicker'
interface OutlierInputFormProps {
  outlierDate?: Date
}

export const OutlierInputForm = ({ outlierDate }: OutlierInputFormProps) => {
  if (!outlierDate) return null
  return (
    <Box style={{ maxWidth: 390 }}>
      <DatePicker
        readOnly
        placeholderText="Valin dagsetning fyrir úrbótafrest"
        icon={{ name: 'calendar', type: 'outline' }}
        size="sm"
        name="outlierCorrectionDate"
        label="Frestur til úrbóta"
        selected={outlierDate}
      />
    </Box>
  )
}
