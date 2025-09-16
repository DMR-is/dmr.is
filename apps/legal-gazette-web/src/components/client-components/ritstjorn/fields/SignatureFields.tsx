'use client'

import {
  DatePicker,
  GridColumn,
  GridRow,
  Input,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { toast } from '@island.is/island-ui/core'

import { useAdvertContext } from '../../../../hooks/useAdvertContext'
import { useUpdateAdvert } from '../../../../hooks/useUpdateAdvert'

export const SignatureFields = () => {
  const { advert } = useAdvertContext()

  const {
    signatureDate,
    signatureName,
    signatureLocation,
    signatureOnBehalfOf,
  } = advert

  const { trigger } = useUpdateAdvert(advert.id)

  return (
    <Stack space={[1, 2]}>
      <GridRow>
        <GridColumn span="12/12">
          <Text variant="h3">Undirritun</Text>
        </GridColumn>
      </GridRow>
      <GridRow rowGap={[1, 2]}>
        <GridColumn span={['12/12', '6/12']}>
          <Input
            name="signatureName"
            backgroundColor="blue"
            size="sm"
            label="Nafn undirritara"
            defaultValue={signatureName}
            onBlur={(evt) => {
              if (evt.target.value === advert.signatureName) return

              return trigger(
                { signatureName: evt.target.value },
                {
                  onSuccess: () => {
                    toast.success('Nafn undirritara vistað', {
                      toastId: 'save-signature',
                    })
                  },
                  onError: () => {
                    toast.error('Villa við að vista nafn undirritara', {
                      toastId: 'save-signature',
                    })
                  },
                },
              )
            }}
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <Input
            name="signatureOnBehalfOf"
            backgroundColor="blue"
            size="sm"
            label="Fyrir hönd"
            defaultValue={signatureOnBehalfOf ?? ''}
            onBlur={(evt) =>
              trigger(
                { signatureOnBehalfOf: evt.target.value },
                {
                  onSuccess: () => {
                    toast.success('Fyrir hönd vistað', {
                      toastId: 'save-signature',
                    })
                  },
                  onError: () => {
                    toast.error('Villa við að vista fyrir hönd', {
                      toastId: 'save-signature',
                    })
                  },
                },
              )
            }
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <Input
            name="signatureLocation"
            backgroundColor="blue"
            size="sm"
            label="Staður undirritunar"
            defaultValue={signatureLocation}
            onBlur={(evt) =>
              trigger(
                { signatureLocation: evt.target.value },
                {
                  onSuccess: () => {
                    toast.success('Staður undirritunar vistaður', {
                      toastId: 'save-signature',
                    })
                  },
                  onError: () => {
                    toast.error('Villa við að vista stað undirritunar', {
                      toastId: 'save-signature',
                    })
                  },
                },
              )
            }
          />
        </GridColumn>
        <GridColumn span={['12/12', '6/12']}>
          <DatePicker
            name="signatureDate"
            backgroundColor="blue"
            placeholderText=""
            size="sm"
            label="Dagsetning undirritunar"
            selected={new Date(signatureDate)}
            handleChange={(date) =>
              trigger(
                { signatureDate: date?.toISOString() },
                {
                  onSuccess: () => {
                    toast.success('Dagsetning undirritunar vistuð', {
                      toastId: 'save-signature',
                    })
                  },
                  onError: () => {
                    toast.error('Villa við að vista dagsetningu undirritunar', {
                      toastId: 'save-signature',
                    })
                  },
                },
              )
            }
          />
        </GridColumn>
      </GridRow>
    </Stack>
  )
}
