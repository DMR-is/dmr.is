import { useEffect, useState } from 'react'

import {
  AccordionItem,
  Checkbox,
  DatePicker,
  Divider,
  Inline,
  SkeletonLoader,
  Stack,
  toast,
} from '@island.is/island-ui/core'

import { useUpdatePublishDate } from '../../hooks/api'
import { useUpdateFastTrack } from '../../hooks/api/update/useUpdateFasttrack'
import { useCaseContext } from '../../hooks/useCaseContext'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { messages } from '../form-steps/messages'
import { PriceCalculator } from '../price/calculator'
import { Spinner } from '../spinner/Spinner'

type Props = {
  toggle: boolean
  onToggle: () => void
}

export const PublishingFields = ({ toggle: expanded, onToggle }: Props) => {
  const { formatMessage } = useFormatMessage()

  const { currentCase, refetch, canEdit } = useCaseContext()

  const [fastTrack, setFastTrack] = useState(currentCase.fastTrack)
  const [fastTrackDelay, setFastTrackDelay] = useState(false)

  useEffect(() => {
    setFastTrackDelay(true)
    const delay = setInterval(() => {
      setFastTrackDelay(false)
    }, 1000)

    return () => {
      clearInterval(delay)
    }
  }, [fastTrack])

  const { trigger: updateFasttrack } = useUpdateFastTrack({
    caseId: currentCase.id,
    options: {
      onSuccess: () => {
        toast.success('Hraðbirtingarstaða auglýsingar hefur verið uppfærð')
        refetch()
      },
      onError: () => {
        toast.error('Ekki tókst að uppfæra hraðbirtingarstaða auglýsingar')
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
              handleChange={(date) =>
                updatePublishingDate({ date: date.toISOString() })
              }
            />
          )}
          <Inline alignY="center" space={1}>
            {fastTrackDelay && <Spinner />}
            <Checkbox
              disabled={fastTrackDelay || !canEdit}
              checked={currentCase.fastTrack}
              label="Óskað er eftir hraðbirtingu"
              onChange={(e) => {
                updateFasttrack({ fastTrack: e.target.checked })
                setFastTrack(e.target.checked)
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
