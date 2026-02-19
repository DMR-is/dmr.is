'use client'

import addYears from 'date-fns/addYears'
import get from 'lodash/get'
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
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'
import {
  getInvalidPublishingDatesInRange,
  getNextValidPublishingDate,
} from '@dmr.is/utils/client/dateUtils'

import { ApplicationTypeEnum } from '../../gen/fetch'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { FormElement } from '../form-element/FormElement'
import { FormGroup } from '../form-group/FormGroup'
const partialSchema = createDivisionEndingInput.partial()

type Props = {
  applicationId: string
}
type FormErrors = z.core.$ZodErrorTree<z.infer<typeof createDivisionEndingInput>>

export const CreateDivisionEnding = ({ applicationId }: Props) => {
  const trpc = useTRPC()
  const [state, setState] = useState<z.infer<typeof partialSchema>>({})
  const [errors, setErrors] = useState<FormErrors | null>(null)

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

  const courtDistrictInfo = get(
    application?.answers,
    'fields.courtAndJudgmentFields',
  ) as unknown as { courtDistrict?: { title?: string }; judgmentDate?: string }

  const minDate = getNextValidPublishingDate(
    dateData?.minDate ? new Date(dateData.minDate) : new Date(),
  )
  const maxDate = getNextValidPublishingDate(addYears(new Date(), 3))
  const invalidPublishingDates = getInvalidPublishingDatesInRange(
    minDate,
    maxDate,
  )

  const preview = getAdvertHTMLMarkup({
    templateType: ApplicationTypeEnum.RECALLBANKRUPTCY
      ? LegalGazetteHTMLTemplates.DIVISION_ENDING_BANKRUPTCY
      : LegalGazetteHTMLTemplates.DIVISION_ENDING_DECEASED,
    signature: state.signature,
    endingDate: state.endingDate,
    title: 'Skiptalok',
    publishDate: state.scheduledAt,
    additionalText: state.additionalText,
    content: state.content,
    settlementDeclaredClaims: state.declaredClaims,
    courtDistrict: courtDistrictInfo?.courtDistrict?.title?.replace(
      'Héraðsdómur',
      'Héraðsdóms',
    ),
    judgementDate: courtDistrictInfo?.judgmentDate,
    settlementName: settlementInfo?.name,
    settlementNationalId: settlementInfo?.nationalId,
  })

  const handleSetState = (
    key: keyof typeof state,
    val: (typeof state)[typeof key],
  ) => {
    setState((prev) => ({ ...prev, [key]: val }))
  }

  const handleSubmit = () => {
    const check = createDivisionEndingInput.safeParse(state)
    if (!check.success) {
      setErrors(z.treeifyError(check.error))
      return
    }
    setErrors(null)
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
            hasError={!!errors?.properties?.endingDate?.errors.length}
            errorMessage={errors?.properties?.endingDate?.errors[0]}
            onChange={(date) => {
              handleSetState('endingDate', date)
              setErrors((prev) => prev?.properties ? { ...prev, properties: { ...prev.properties, endingDate: undefined } } : prev)
            }}
          />
          <FormElement
            required={true}
            type="date"
            minDate={minDate}
            maxDate={maxDate}
            excludeDates={invalidPublishingDates}
            label="Dagsetning birtingar"
            hasError={!!errors?.properties?.scheduledAt?.errors.length}
            errorMessage={errors?.properties?.scheduledAt?.errors[0]}
            onChange={(date) => {
              handleSetState('scheduledAt', date)
              setErrors((prev) => prev?.properties ? { ...prev, properties: { ...prev.properties, scheduledAt: undefined } } : prev)
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
              setErrors((prev) => prev?.properties ? { ...prev, properties: { ...prev.properties, signature: undefined } } : prev)
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
              setErrors((prev) => prev?.properties ? { ...prev, properties: { ...prev.properties, signature: undefined } } : prev)
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
              setErrors((prev) => prev?.properties ? { ...prev, properties: { ...prev.properties, signature: undefined } } : prev)
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
            width="full"
            type="submit"
            buttonText="Staðfesta og senda inn til birtingar"
            onClick={handleSubmit}
          />
        </FormGroup>
      </Stack>
    </Modal>
  )
}
