import { useFormContext } from 'react-hook-form'

import { RecallApplicationWebSchema } from '@dmr.is/legal-gazette/schemas'
import { Text } from '@dmr.is/ui/components/island-is'

import { FormStep } from '../../../form-step/FormStep'
import { RecallDivisionFields } from '../fields/RecallDivisionFields'
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
      title: 'Skiptafundur',
      intro: isBankruptcy ? (
        <Text>Hvar og hvenær fyrsti skiptafundur fer fram</Text>
      ) : (
        <Text>
          Fylltu út reitina hér fyrir neðan ef þú vilt auglýsa skiptafund með
          innköllunni
        </Text>
      ),
      content: <RecallDivisionFields isBankruptcy={isBankruptcy} />,
    },
    {
      title: 'Upplýsingar um skiptastjóra',
      // intro: <Text>Fylla þarf út nafn og staðsetningu skiptastjóra</Text>,
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
