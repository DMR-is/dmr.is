import { FormStep } from '../../../form-step/FormStep'
import { AdvertContentField } from '../fields/AdvertContentFields'
import { CommonAdvertFields } from '../fields/CommonAdvertFields'

export const AdvertStep = () => {
  const items = [
    {
      title: 'Tegund og flokkur auglýsingar',
      content: <CommonAdvertFields />,
    },
    {
      title: 'Meginmál auglýsingar',
      content: <AdvertContentField />,
    },
  ]

  return <FormStep items={items} />
}
