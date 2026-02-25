'use client'

import { addYears } from 'date-fns'
import get from 'lodash/get'
import { useState } from 'react'
import * as z from 'zod'

import {
  getAdvertHTMLMarkup,
  LegalGazetteHTMLTemplates,
} from '@dmr.is/legal-gazette/html'
import { createDivisionMeetingInput } from '@dmr.is/legal-gazette/schemas'
import { useQuery } from '@dmr.is/trpc/client/trpc'
import { AdvertDisplay } from '@dmr.is/ui/components/AdvertDisplay/AdvertDisplay'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'
import {
  getInvalidPublishingDatesInRange,
  getNextValidPublishingDate,
} from '@dmr.is/utils/client/dateUtils'

import { ApplicationTypeEnum } from '../../gen/fetch'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { FormElement } from '../form-element/FormElement'
import { FormGroup } from '../form-group/FormGroup'

import { useMutation, useQueryClient } from '@tanstack/react-query'

const partialSchema = createDivisionMeetingInput.partial()

type Props = {
  applicationId: string
}

type FormErrors = z.core.$ZodErrorTree<
  z.infer<typeof createDivisionMeetingInput>
>

export const CreateDivisionMeeting = ({ applicationId }: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [state, setState] = useState<z.infer<typeof partialSchema>>({})
  const [errors, setErrors] = useState<FormErrors | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  const { data: dateData } = useQuery(
    trpc.getMininumDateForDivisionMeeting.queryOptions({
      applicationId: applicationId,
    }),
  )

  const { data: application } = useQuery(
    trpc.getApplicationById.queryOptions({ id: applicationId }),
  )
  const settlementInfo = get(
    application?.answers,
    'fields.settlementFields',
  ) as unknown as { name?: string; nationalId?: string }

  const { mutate: addDivisionMeeting, isPending: isAddingDivisionMeeting } =
    useMutation(
      trpc.addDivisionMeeting.mutationOptions({
        onSuccess: () => {
          queryClient.invalidateQueries(trpc.getApplicationById.queryFilter({ id: applicationId }))
          toast.success('Skiptafundur stofnaður', {
            toastId: 'create-division-meeting',
          })
          setState({})
          setErrors(null)
          setIsVisible(false)
        },
        onError: () => {
          toast.error('Ekki tókst að stofna skiptafund, reyndu aftur síðar', {
            toastId: 'create-division-meeting',
          })
        },
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

  const handleSetState = (
    key: keyof typeof state,
    val: (typeof state)[typeof key],
  ) => {
    setState((prev) => ({ ...prev, [key]: val }))
  }

  const clearFieldError = (
    field: keyof z.infer<typeof createDivisionMeetingInput>,
  ) => {
    setErrors((prev) =>
      prev?.properties
        ? { ...prev, properties: { ...prev.properties, [field]: undefined } }
        : prev,
    )
  }

  const handleSubmit = () => {
    const check = createDivisionMeetingInput.safeParse(state)
    if (!check.success) {
      setErrors(z.treeifyError(check.error))
      return
    }
    addDivisionMeeting({ applicationId, ...check.data })
    setErrors(null)
  }

  const disclosure = (
    <Button variant="utility" icon="add" size="small">
      Bæta við skiptafundi
    </Button>
  )

  const sharedMeetingProps = {
    meetingDate: state.meetingDate,
    meetingLocation: state.meetingLocation,
    content: state.content,
    additionalText: state.additionalText,
    signature: state.signature,
    title: `Skiptafundur - ${settlementInfo?.name}`,
    name: settlementInfo?.name,
    nationalId: settlementInfo?.nationalId,
  }

  const preview = getAdvertHTMLMarkup(
    ApplicationTypeEnum.RECALLBANKRUPTCY
      ? {
          templateType: LegalGazetteHTMLTemplates.DIVISION_MEETING_BANKRUPTCY,

          ...sharedMeetingProps,
        }
      : {
          templateType: LegalGazetteHTMLTemplates.DIVISION_MEETING_DECEASED,
          ...sharedMeetingProps,
        },
  )

  return (
    <Modal
      baseId="create-division-meeting"
      disclosure={disclosure}
      title="Bæta við skiptafundi"
      isVisible={isVisible}
      onVisibilityChange={setIsVisible}
    >
      <Stack space={1}>
        <FormGroup>
          <FormElement
            width="full"
            type="text"
            label="Frjáls texti"
            onChange={(e) => handleSetState('additionalText', e.target.value)}
          />
        </FormGroup>
        <FormGroup title="Skiptafundur">
          <FormElement
            required
            type="text"
            label="Staðsetning skiptafundar"
            hasError={!!errors?.properties?.meetingLocation?.errors.length}
            errorMessage={errors?.properties?.meetingLocation?.errors[0]}
            onChange={(e) => {
              handleSetState('meetingLocation', e.target.value)
              clearFieldError('meetingLocation')
            }}
          />
          <FormElement
            required
            type="date"
            minDate={minDate}
            maxDate={maxDate}
            excludeDates={invalidPublishingDates}
            label="Dagsetning og tími skiptafundar"
            showTimeInput
            timeInputLabel="Klukkan"
            hasError={!!errors?.properties?.meetingDate?.errors.length}
            errorMessage={errors?.properties?.meetingDate?.errors[0]}
            onChange={(date) => {
              handleSetState('meetingDate', date.toISOString())
              clearFieldError('meetingDate')
            }}
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
        <FormGroup
          title="Undirritun"
          error={errors?.properties?.signature?.errors[0]}
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
            onChange={(e) => {
              handleSetState('signature', {
                ...state.signature,
                name: e.target.value,
              })
              clearFieldError('signature')
            }}
          />
          <FormElement
            type="text"
            label="Staðsetning undirritunar"
            onChange={(e) => {
              handleSetState('signature', {
                ...state.signature,
                location: e.target.value,
              })
              clearFieldError('signature')
            }}
          />
          <FormElement
            type="date"
            label="Dagsetning undirritunar"
            onChange={(date) => {
              handleSetState('signature', {
                ...state.signature,
                date: date.toISOString(),
              })
              clearFieldError('signature')
            }}
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
          <GridColumn span="12/12">
            <AdvertDisplay html={preview} />
          </GridColumn>
        </FormGroup>
        <FormGroup>
          <FormElement
            isLoading={isAddingDivisionMeeting}
            width="full"
            type="submit"
            buttonText="Stofna skiptafund"
            onClick={handleSubmit}
          />
        </FormGroup>
      </Stack>
    </Modal>
  )
}
