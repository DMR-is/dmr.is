import { Stack } from '@dmr.is/ui/components/island-is/Stack'

import { CompanyLookup } from '../../../../company-lookup/CompanyLookup'
import { RecallSettlementDefault } from './RecallSettlementDefault'

export const RecallSettlementOwner = () => {
  return (
    <Stack space={[2, 3]}>
      <RecallSettlementDefault />
      <CompanyLookup />
    </Stack>
  )
}
