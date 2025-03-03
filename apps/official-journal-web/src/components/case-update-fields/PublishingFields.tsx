import debounce from 'lodash/debounce'

import {
  AccordionItem,
  Box,
  Checkbox,
  DatePicker,
  Inline,
  SkeletonLoader,
  Stack,
  toast,
  useBreakpoint,
} from '@island.is/island-ui/core'

import { useUpdatePrice, useUpdatePublishDate } from '../../hooks/api'
import { useUpdateFastTrack } from '../../hooks/api/update/useUpdateFasttrack'
import { useUpdatePaid } from '../../hooks/api/update/useUpdatePaid'
import { useCaseContext } from '../../hooks/useCaseContext'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { messages } from '../form-steps/messages'
import { OJOIInput } from '../select/OJOIInput'

type Props = {
  toggle: boolean
  onToggle: () => void
}

export const PublishingFields = ({ toggle: expanded, onToggle }: Props) => {
  const { formatMessage } = useFormatMessage()

  const { currentCase, refetch, canEdit, handleOptimisticUpdate } =
    useCaseContext()

  const { md } = useBreakpoint()

  const { trigger: updatePrice } = useUpdatePrice({
    caseId: currentCase.id,
    options: {
      onSuccess: () => {
        toast.success('Verð auglýsingar hefur verið uppfært')
        refetch()
      },
      onError: () => {
        toast.error('Ekki tókst að uppfæra verð auglýsingar')
      },
    },
  })

  const { trigger: updatePaid } = useUpdatePaid({
    caseId: currentCase.id,
    options: {
      onSuccess: () => {
        toast.success('Greiðslustaða auglýsingar hefur verið uppfærð', {
          toastId: 'paid',
        })
        refetch()
      },
      onError: () => {
        toast.error('Ekki tókst að uppfæra greiðslustöðu auglýsingar', {
          toastId: 'paid',
        })
      },
    },
  })

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
        toast.success('Dagsetning auglýsingar hefur verið uppfærð')
        refetch()
      },
      onError: () => {
        toast.error('Ekki tókst að uppfæra dagsetningu auglýsingar')
      },
    },
  })

  const debouncedUpdatePrice = debounce(updatePrice, 500)

  const updatePriceHandler = (value: string) => {
    debouncedUpdatePrice.cancel()
    debouncedUpdatePrice({ price: parseInt(value, 10) })
  }

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
            selected={new Date(currentCase.createdAt)}
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
        <Inline alignY="center" space={[2, 4]}>
          <Box style={{ minWidth: md ? '308px' : '254px' }}>
            <OJOIInput
              disabled={!canEdit}
              name="price"
              defaultValue={currentCase.price}
              label={formatMessage(messages.grunnvinnsla.price)}
              type="number"
              inputMode="numeric"
              onChange={(e) => updatePriceHandler(e.target.value)}
            />
          </Box>
          <Inline alignY="center" space={1}>
            <Checkbox
              checked={currentCase.paid}
              disabled={!canEdit}
              onChange={(e) => {
                handleOptimisticUpdate(
                  { ...currentCase, paid: e.target.checked },
                  () => updatePaid({ paid: e.target.checked }),
                )
              }}
              label="Búið er að greiða"
            />
          </Inline>
        </Inline>
      </Stack>
    </AccordionItem>
  )
}
