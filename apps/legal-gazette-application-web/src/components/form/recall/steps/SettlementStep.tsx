import { useFormContext } from 'react-hook-form'

import { RecallApplicationWebSchema } from '@dmr.is/legal-gazette/schemas'
import { Text } from '@dmr.is/ui/components/island-is'

import { FormStep } from '../../../form-step/FormStep'
import { RecallLiquidatorFields } from '../fields/RecallLiquidatorFields'
import { RecallRequirementStatementFields } from '../fields/RecallRequirementStatementFields'
import { RecallSettlementFields } from '../fields/settlement/RecallSettlementFields'

export const SettlementStep = () => {
  const { getValues } = useFormContext<RecallApplicationWebSchema>()
  const isBankruptcy = getValues('metadata.isBankruptcy')

  const items = [
    {
      title: isBankruptcy ? 'Nánar um þrotabúið' : 'Nánar um dánarbúið',
      intro: (
        <Text>
          {`${`Sláðu inn kennitölu hér fyrir neðan og við munum sækja upplýsingar um `}${isBankruptcy ? 'þrotabúið' : 'dánarbúið'}`}
        </Text>
      ),
      content: <RecallSettlementFields />,
    },
    {
      title: 'Upplýsingar um skiptastjóra',
      intro: <Text>Fylla þarf út nafn og staðsetningu skiptastjóra</Text>,
      content: <RecallLiquidatorFields />,
    },
    {
      title: 'Kröfulýsingar',
      intro: (
        <Text>Kröfulýsingar sem berast skiptastjóri á eftirfarandi máta</Text>
      ),
      content: <RecallRequirementStatementFields />,
    },
  ]

  return <FormStep items={items} />
}
