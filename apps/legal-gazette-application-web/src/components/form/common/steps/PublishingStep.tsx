import { FormStep } from '../../../form-step/FormStep'
import { CommunicationChannelFields } from '../../fields/CommunicationChannelFields'
import { PublishingFields } from '../fields/PublishingFields'

export const PublishingStep = () => {
  const items = [
    { title: 'Birtingardagar', content: <PublishingFields /> },
    {
      title: 'Samskiptaleiðir',
      content: <CommunicationChannelFields />,
    },
  ]

  return <FormStep items={items} />
}
