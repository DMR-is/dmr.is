import { isEmpty } from 'class-validator'
import { useFormContext } from 'react-hook-form'

import {
  RecallApplicationWebSchema,
  SettlementType,
} from '@dmr.is/legal-gazette/schemas'
import {
  AlertMessage,
  GridColumn,
  GridRow,
  Text,
} from '@dmr.is/ui/components/island-is'

import { RecallSettlementDefault } from './RecallSettlementDefault'
import { RecallSettlementOwner } from './RecallSettlementOwner'
import { RecallSettlementSelect } from './RecallSettlmentSelect'

export const RecallDeceasedSettlementFields = () => {
  const { watch } = useFormContext<RecallApplicationWebSchema>()

  const selectedType = watch('fields.settlementFields.type')

  const Component = isEmpty(selectedType) ? (
    <GridRow rowGap={[2, 3]}>
      <GridColumn span="12/12">
        <AlertMessage
          type="info"
          title="Tegund dánarbús vantar"
          message="Veldu tegund dánarbús hér fyrir ofan"
        />
      </GridColumn>
    </GridRow>
  ) : selectedType === SettlementType.OWNER ? (
    <RecallSettlementOwner />
  ) : (
    <RecallSettlementDefault />
  )

  return (
    <>
      <GridRow marginBottom={[2, 3]} rowGap={[2, 3]}>
        <GridColumn span="12/12">
          <Text variant="h4">Upplýsingar um dánarbúið</Text>
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <RecallSettlementSelect />
        </GridColumn>
      </GridRow>
      {Component}
    </>
  )
}
