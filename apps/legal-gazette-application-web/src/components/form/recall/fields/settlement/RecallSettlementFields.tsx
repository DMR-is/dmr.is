import { useFormContext } from 'react-hook-form'

import {
  ApplicationTypeEnum,
  RecallApplicationWebSchema,
} from '@dmr.is/legal-gazette/schemas'

import { RecallBankruptcySettlementFields } from './RecallBankruptcySettlementFields'
import { RecallDeceasedSettlementFields } from './RecallDeceasedSettlementFields'

export const RecallSettlementFields = () => {
  const { getValues } = useFormContext<RecallApplicationWebSchema>()

  const { type } = getValues('metadata')

  if (type === ApplicationTypeEnum.RECALL_BANKRUPTCY) {
    return <RecallBankruptcySettlementFields />
  }

  return <RecallDeceasedSettlementFields />
}
