import { useEffect, useState } from 'react'

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
import { OJOISelect } from '../select/OJOISelect'
import { Spinner } from '../spinner/Spinner'
import { OJOITag } from '../tags/OJOITag'

type Props = {
  toggle: boolean
  onToggle: () => void
}

type OptionType = {
  value: string
  label: string
}

export const PublishingFields = ({ toggle: expanded, onToggle }: Props) => {
  const { formatMessage } = useFormatMessage()

  const { currentCase, refetch, canEdit, feeCodeOptions } = useCaseContext()

  const { md } = useBreakpoint()

  const [paid, setPaid] = useState(currentCase.paid)
  const [paidDelay, setPaidDelay] = useState(false)
  const [selectedItems, setSelectedItems] = useState<OptionType[]>(
    currentCase.transaction?.feeCodes?.map((code) => ({
      value: code,
      label: code,
    })) || [],
  )

  const [fastTrack, setFastTrack] = useState(currentCase.fastTrack)
  const [fastTrackDelay, setFastTrackDelay] = useState(false)

  useEffect(() => {
    setPaidDelay(true)
    const delay = setInterval(() => {
      setPaidDelay(false)
    }, 1000)

    return () => {
      clearInterval(delay)
    }
  }, [paid])

  useEffect(() => {
    setFastTrackDelay(true)
    const delay = setInterval(() => {
      setFastTrackDelay(false)
    }, 1000)

    return () => {
      clearInterval(delay)
    }
  }, [fastTrack])

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
        toast.success('Greiðslustaða auglýsingar hefur verið uppfærð')
        refetch()
      },
      onError: () => {
        toast.error('Ekki tókst að uppfæra greiðslustöðu auglýsingar')
      },
    },
  })

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

  const handleCodeSelection = (items: OptionType[]) => {
    const feeCodes = items.map((item) => item.value)
    setSelectedItems(items)
    updatePrice({ feeCodes })
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
        <Inline alignY="center" space={[2, 4]}>
          <Box style={{ minWidth: md ? '308px' : '254px' }}>
            <OJOIInput
              disabled={!canEdit}
              readOnly
              name="price"
              value={currentCase.price}
              label={formatMessage(messages.grunnvinnsla.price)}
              type="number"
              inputMode="numeric"
            />
          </Box>
          <Inline alignY="center" space={1}>
            {paidDelay && <Spinner />}
            <Checkbox
              checked={currentCase.paid}
              disabled={paidDelay || !canEdit}
              onChange={(e) => {
                updatePaid({ paid: e.target.checked })
                setPaid(e.target.checked)
              }}
              label="Búið er að greiða"
            />
          </Inline>
        </Inline>
        <Box style={{ maxWidth: md ? '308px' : '254px' }}>
          <Stack space={1}>
            <OJOISelect
              isDisabled={!canEdit}
              key={selectedItems.map((item) => item.value).join('')}
              label="Bæta við gjaldflokki"
              placeholder="Veldu gjaldflokk"
              options={feeCodeOptions?.filter(
                (item) =>
                  !selectedItems.find(
                    (selected) => selected.value === item.value,
                  ),
              )}
              value={undefined}
              onChange={(opt) => {
                if (opt) {
                  if (selectedItems.find((item) => item.value === opt.value)) {
                    handleCodeSelection(
                      selectedItems.filter((item) => item.value !== opt.value),
                    )
                  } else {
                    handleCodeSelection([...selectedItems, opt])
                  }
                }
              }}
            />
            <Inline space={1} flexWrap="wrap">
              {selectedItems?.map((fee, i) => (
                <OJOITag
                  disabled={!canEdit}
                  key={i}
                  variant="blue"
                  outlined
                  closeable
                  onClick={() => {
                    const updatedSelected = selectedItems.filter(
                      (item) => item.value !== fee.value,
                    )
                    handleCodeSelection(updatedSelected)
                  }}
                >
                  {fee.label}
                </OJOITag>
              ))}
            </Inline>
          </Stack>
        </Box>
      </Stack>
    </AccordionItem>
  )
}
