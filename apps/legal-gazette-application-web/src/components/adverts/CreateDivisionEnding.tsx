'use client'

import addYears from 'date-fns/addYears'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'
import {
  getInvalidPublishingDatesInRange,
  getNextValidPublishingDate,
} from '@dmr.is/utils/client/dateUtils'

import { useTRPC } from '../../lib/trpc/client/trpc'
import { FormElement } from '../form-element/FormElement'
import { FormGroup } from '../form-group/FormGroup'

import { useMutation, useQueryClient } from '@tanstack/react-query'

type Props = {
  applicationId: string
}
export const CreateDivisionEnding = ({ applicationId }: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { mutate: addDivisionEnding, isPending } = useMutation(
    trpc.addDivisionEnding.mutationOptions(),
  )

  const { data: dateData } = useQuery(
    trpc.getMininumDateForDivisionMeeting.queryOptions({
      applicationId: applicationId,
    }),
  )

  const minDate = getNextValidPublishingDate(
    dateData?.minDate ? new Date(dateData.minDate) : new Date(),
  )
  const maxDate = getNextValidPublishingDate(addYears(new Date(), 3))
  const invalidPublishingDates = getInvalidPublishingDatesInRange(
    minDate,
    maxDate,
  )

  const disclosure = (
    <Button variant="utility" icon="add" size="small">
      Bæta við skiptalokum
    </Button>
  )

  return (
    <Modal
      baseId="create-division-ending"
      disclosure={disclosure}
      title="Bæta við skiptalokum"
    >
      <Stack space={1}>
        <FormGroup>
          <FormElement width="full" type="text" label="Frjáls texti" />
        </FormGroup>
        <FormGroup title="Mikilvægar dagsetningar">
          <FormElement
            required={true}
            type="date"
            label="Dagsetning skiptaloka"
          />
          <FormElement
            required={true}
            type="date"
            label="Dagsetning birtingar"
          />
        </FormGroup>
        <FormGroup title="Efni auglýsingar">
          <FormElement width="full" type="editor" />
        </FormGroup>
        <FormGroup title="Lýstar kröfur búsins">
          <FormElement
            type="text"
            label="Lýstar kröfur"
            placeholder="Sláðu inn upphæð ef á við"
          />
        </FormGroup>
        <FormGroup
          title="Undirritun"
          subTitle={
            <Text variant="small">
              Fylla þarf út nafn, staðsetningu eða dagsetningu undirritunar{' '}
              <Text fontWeight="regular" color="red600" as="span">
                *
              </Text>
            </Text>
          }
        >
          <FormElement type="text" label="Nafn undirritara" />
          <FormElement type="text" label="Staðsetning undirritunar" />
          <FormElement type="date" label="Dagsetning undirritunar" />
          <FormElement type="text" label="Fyrir hönd undirritara" />
        </FormGroup>
        <FormGroup title="Forskoðun"></FormGroup>
        <FormGroup>
          <FormElement
            width="full"
            type="submit"
            buttonText="Staðfesta og senda inn til birtingar"
            onClick={() => console.log('wow')}
          />
        </FormGroup>
      </Stack>
    </Modal>
  )
}
