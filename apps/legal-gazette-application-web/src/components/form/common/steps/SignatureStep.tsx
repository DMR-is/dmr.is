import { Text } from '@dmr.is/ui/components/island-is'

import { FormStep } from '../../../form-step/FormStep'
import { SignatureFields } from '../../fields/SignatureFields'

export const SignatureStep = () => {
  const items = [
    {
      title: 'Undirritun',
      intro: (
        <Text>
          Fylla þarf út eitt af eftirfarandi: nafn, staðsetningu eða dagsetningu
          undirritunar
        </Text>
      ),
      content: <SignatureFields />,
    },
  ]

  return <FormStep items={items} />
}
