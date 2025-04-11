import addYears from 'date-fns/addYears'

import {
  AccordionItem,
  Checkbox,
  DatePicker,
  Divider,
  Inline,
  SkeletonLoader,
  Stack,
  toast,
  useBreakpoint,
} from '@island.is/island-ui/core'

import { useUpdatePublishDate } from '../../hooks/api'
import { useUpdateFastTrack } from '../../hooks/api/update/useUpdateFasttrack'
import { useCaseContext } from '../../hooks/useCaseContext'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { messages } from '../form-steps/messages'
import { PriceCalculator } from '../price/calculator'
import { getExcludedDates } from './utils'

type Props = {
  toggle: boolean
  onToggle: () => void
}

export const PublishingFields = ({ toggle: expanded, onToggle }: Props) => {
  const { formatMessage } = useFormatMessage()

  const { currentCase, refetch, canEdit, handleOptimisticUpdate } =
    useCaseContext()

  const createdAt = new Date(currentCase.createdAt)
  const maxEndDate = addYears(createdAt, 5)

  const { md } = useBreakpoint()

  const { trigger: updateFasttrack } = useUpdateFastTrack({
    caseId: currentCase.id,
    options: {
      onSuccess: () => {
        toast.success('Hraðbirtingarstaða auglýsingar hefur verið uppfærð', {
          toastId: 'fasttrack',
        })
        refetch()
      },
      onError: () => {
        toast.error('Ekki tókst að uppfæra hraðbirtingarstaða auglýsingar', {
          toastId: 'fasttrack',
        })
      },
    },
  })

  const {
    trigger: updatePublishingDate,
    isMutating: isUpdatingPublishingDate,
  } = useUpdatePublishDate({
    caseId: currentCase.id,
    options: {
      onSuccess: () => {
        toast.success('Dagsetning auglýsingar hefur verið uppfærð', {
          toastId: 'dateUpdatePublishing',
        })
        refetch()
      },
      onError: () => {
        toast.error('Ekki tókst að uppfæra dagsetningu auglýsingar')
      },
    },
  })

  return (
    <AccordionItem
      id="publishingFields"
      expanded={expanded}
      onToggle={onToggle}
      label={formatMessage(messages.grunnvinnsla.group2title)}
      labelVariant="h5"
      iconVariant="small"
    >
      <Stack space={2}>
        <Inline alignY="center" space={[2, 4]}>
          <DatePicker
            locale="is"
            disabled
            size="sm"
            backgroundColor="blue"
            selected={createdAt}
            label={formatMessage(messages.grunnvinnsla.createdDate)}
            placeholderText=""
          />
        </Inline>
        <Inline alignY="center" space={[2, 4]}>
          {isUpdatingPublishingDate ? (
            <SkeletonLoader height={64} borderRadius="large" />
          ) : (
            <DatePicker
              disabled={!canEdit}
              key={currentCase.requestedPublicationDate}
              locale="is"
              size="sm"
              backgroundColor="blue"
              minDate={createdAt}
              maxDate={maxEndDate}
              excludeDates={getExcludedDates(createdAt, maxEndDate)}
              placeholderText="Dagsetning birtingar"
              selected={new Date(currentCase.requestedPublicationDate)}
              label={formatMessage(messages.grunnvinnsla.publicationDate)}
              handleChange={(date) => {
                const publishingDate = date.toISOString()
                handleOptimisticUpdate(
                  { ...currentCase, requestedPublicationDate: publishingDate },
                  () => updatePublishingDate({ date: publishingDate }),
                )
              }}
            />
          )}
          <Inline alignY="center" space={1}>
            <Checkbox
              disabled={!canEdit}
              checked={currentCase.fastTrack}
              label="Óskað er eftir hraðbirtingu"
              onChange={(e) => {
                handleOptimisticUpdate(
                  { ...currentCase, fastTrack: e.target.checked },
                  () => updateFasttrack({ fastTrack: e.target.checked }),
                )
              }}
            />
          </Inline>
        </Inline>
        <Divider weight="faded" />
        <PriceCalculator />
      </Stack>
    </AccordionItem>
  )
}
