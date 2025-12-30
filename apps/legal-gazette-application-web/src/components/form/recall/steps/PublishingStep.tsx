import { Text } from '@dmr.is/ui/components/island-is'

import { FormStep } from '../../../form-step/FormStep'
import { CommunicationChannelFields } from '../../fields/CommunicationChannelFields'
import { PublishingFields } from '../../fields/PublishingFields'

type Props = {
  type?: 'RECALL' | 'COMMON'
}

export const PublishingStep = ({ type = 'COMMON' }: Props) => {
  const items = [
    {
      title: 'Birting auglýsingarinnar',
      intro: (
        <Text>
          Veldu dagsetningar hér fyrir neðan um ósk um birtingardag. Að minnsta
          kosti einn birtingardagur er nauðsynlegur og mest þrír.
        </Text>
      ),
      content: (
        <PublishingFields
          additionalTitle={type === 'RECALL' ? 'innköllunar' : undefined}
          applicationType={type}
        />
      ),
    },
    {
      title: 'Samskiptaleiðir',
      intro: (
        <Text>
          Bættu við upplýsingum um tengiliða, tengiliðir í samskiptaleiðium fá
          tilkynningar varðandi útgáfu á auglýsingunni.
        </Text>
      ),
      content: <CommunicationChannelFields />,
    },
  ]

  return <FormStep items={items} />
}
