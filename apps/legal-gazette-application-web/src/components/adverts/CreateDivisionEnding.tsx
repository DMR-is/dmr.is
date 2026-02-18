'use client'

import addYears from 'date-fns/addYears'
import { useState } from 'react'
import * as z from 'zod'

import {
  getAdvertHTMLMarkup,
  LegalGazetteHTMLTemplates,
} from '@dmr.is/legal-gazette/html'
import { createDivisionEndingInput } from '@dmr.is/legal-gazette/schemas'
import { useQuery } from '@dmr.is/trpc/client/trpc'
import { AdvertDisplay } from '@dmr.is/ui/components/AdvertDisplay/AdvertDisplay'
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

const partialSchema = createDivisionEndingInput.partial()

type Props = {
  applicationId: string
}
export const CreateDivisionEnding = ({ applicationId }: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { mutate: addDivisionEnding, isPending } = useMutation(
    trpc.addDivisionEnding.mutationOptions(),
  )

  const [state, setState] = useState<z.infer<typeof partialSchema>>({})

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

  const preview = getAdvertHTMLMarkup({
    templateType: LegalGazetteHTMLTemplates.DIVISION_ENDING_BANKRUPTCY,
    signature: state.signature,
    endingDate: state.endingDate,
    title: 'Skiptalok',
    publishDate: state.meetingDate ? new Date(state.meetingDate) : undefined,
    additionalText: state.additionalText,
    content: state.content,
  })

  const handleSetState = (
    key: keyof typeof state,
    val: (typeof state)[typeof key],
  ) => {
    setState((prev) => ({ ...prev, [key]: val }))
  }

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
      <pre>{JSON.stringify(state, null, 2)}</pre>
      <Stack space={1}>
        <FormGroup>
          <FormElement
            width="full"
            type="text"
            label="Frjáls texti"
            onChange={(e) => handleSetState('additionalText', e.target.value)}
          />
        </FormGroup>
        <FormGroup title="Mikilvægar dagsetningar">
          <FormElement
            required={true}
            type="date"
            appearInline={false}
            label="Dagsetning skiptaloka"
            onChange={(date) => handleSetState('endingDate', date.toISOString())}
          />
          <FormElement
            required={true}
            type="date"
            label="Dagsetning birtingar"
            onChange={(date) =>
              {
                console.log('date', date)
                return handleSetState('meetingDate', date.toISOString())
              }
            }
          />
        </FormGroup>
        <FormGroup title="Efni auglýsingar">
          <FormElement
            width="full"
            type="editor"
            withZIndex={false}
            onChange={(val) => handleSetState('content', val || undefined)}
          />
        </FormGroup>
        <FormGroup title="Lýstar kröfur búsins">
          <FormElement
            type="text"
            inputType="number"
            label="Lýstar kröfur"
            placeholder="Sláðu inn upphæð ef á við"
            onChange={(e) => handleSetState('declaredClaims', e.target.value)}
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
          <FormElement
            type="text"
            label="Nafn undirritara"
            onChange={(e) =>
              handleSetState('signature', {
                ...state.signature,
                name: e.target.value,
              })
            }
          />
          <FormElement
            type="text"
            label="Staðsetning undirritunar"
            onChange={(e) =>
              handleSetState('signature', {
                ...state.signature,
                location: e.target.value,
              })
            }
          />
          <FormElement
            type="date"
            label="Dagsetning undirritunar"
            onChange={(date) =>
              handleSetState('signature', {
                ...state.signature,
                date: date.toISOString(),
              })
            }
          />
          <FormElement
            type="text"
            label="Fyrir hönd undirritara"
            onChange={(e) =>
              handleSetState('signature', {
                ...state.signature,
                onBehalfOf: e.target.value,
              })
            }
          />
        </FormGroup>
        <FormGroup title="Forskoðun">
          <AdvertDisplay html={preview} />
        </FormGroup>
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
