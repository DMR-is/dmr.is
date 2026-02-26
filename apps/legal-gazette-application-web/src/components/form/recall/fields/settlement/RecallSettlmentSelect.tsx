import { useFormContext } from 'react-hook-form'

import {
  RecallApplicationWebSchema,
  SettlementType,
} from '@dmr.is/legal-gazette-schemas'
import { Select } from '@dmr.is/ui/components/island-is/Select'

import { useUpdateApplication } from '../../../../../hooks/useUpdateApplication'
import { SelectController } from '../../../controllers/SelectController'

const mapOptionToLabel = (type: SettlementType) => {
  switch (type) {
    case SettlementType.DEFAULT:
      return 'Hefðbundið dánarbú'
    case SettlementType.UNDIVIDED:
      return 'Óskipt dánarbú'
    case SettlementType.OWNER:
      return 'Eigandi samlagsfélags'
    default:
      throw new Error('Tegund bús ekki til')
  }
}

export const RecallSettlementSelect = () => {
  const { getValues } = useFormContext<RecallApplicationWebSchema>()
  const { updateApplication } = useUpdateApplication({
    type: 'RECALL',
    id: getValues('metadata.applicationId'),
  })
  const options = Object.values(SettlementType).map((type) => ({
    label: mapOptionToLabel(type),
    value: type,
  }))

  return (
    <SelectController
      name="fields.settlementFields.type"
      label="Tegund dánarbús"
      options={options}
      onChange={(val) =>
        updateApplication(
          {
            fields: { settlementFields: { type: val as SettlementType } },
          },
          {
            successMessage: 'Tegund dánarbús vistað',
            errorMessage: 'Ekki tókst að vista tegund dánarbús',
          },
        )
      }
    />
  )
}
