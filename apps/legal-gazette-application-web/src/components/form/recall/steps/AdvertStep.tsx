import { Text } from '@dmr.is/ui/components/island-is'

import { FormStep } from '../../../form-step/FormStep'
import { SignatureFields } from '../../fields/SignatureFields'
import { RecallAdvertFields } from '../fields/RecallAdvertFields'

export const AdvertStep = () => {
  return (
    <FormStep
      items={[
        {
          title: 'Dómstóll og úrskurðardagur',
          intro: <Text>Dómstóll og úrskurðardagur eru nauðsynlegir</Text>,
          content: <RecallAdvertFields />,
        },
        {
          title: 'Undirritun',
          intro: (
            <Text>
              Fylla þarf út eitt af eftirfarandi: nafn, staðsetningu eða
              dagsetningu undirritunar
            </Text>
          ),
          content: <SignatureFields />,
        },
      ]}
    />
  )
}
