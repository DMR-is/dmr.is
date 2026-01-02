'use client'

import { useFormContext } from 'react-hook-form'

import { CommonApplicationWebSchema } from '@dmr.is/legal-gazette/schemas'
import { Text } from '@dmr.is/ui/components/island-is'

import { FormStep } from '../../../form-step/FormStep'
import { SignatureFields } from '../../fields/SignatureFields'
import { AdvertContentField } from '../fields/AdvertContentFields'
import { CommonAdvertFields } from '../fields/CommonAdvertFields'

export const AdvertStep = () => {
  const { formState } = useFormContext<CommonApplicationWebSchema>()

  const error = formState.errors.signature

  console.log('formState', formState)
  console.log('error in AdvertStep', error)

  const items = [
    {
      title: 'Tegund og flokkur auglýsingar',
      content: <CommonAdvertFields />,
    },
    {
      title: 'Meginmál auglýsingar',
      content: <AdvertContentField />,
    },
    {
      title: 'Undirritun',
      intro: (
        <>
          <Text>
            Fylla þarf út eitt af eftirfarandi: nafn, staðsetningu eða
            dagsetningu undirritunar
          </Text>
        </>
      ),
      content: <SignatureFields />,
    },
  ]

  return <FormStep items={items} />
}
