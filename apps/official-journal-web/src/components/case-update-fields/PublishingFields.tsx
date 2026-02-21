import { AccordionItem } from '@dmr.is/ui/components/island-is/AccordionItem'
import { Checkbox } from '@dmr.is/ui/components/island-is/Checkbox'
import { DatePicker } from '@dmr.is/ui/components/island-is/DatePicker'
import { Divider } from '@dmr.is/ui/components/island-is/Divider'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { SkeletonLoader } from '@dmr.is/ui/components/island-is/SkeletonLoader'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { toast } from '@dmr.is/ui/components/island-is/ToastContainer'

import { useBreakpoint } from '@island.is/island-ui/core/hooks/useBreakpoint'

import { useCaseContext } from '../../hooks/useCaseContext'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { messages } from '../form-steps/messages'
import { PriceCalculator } from '../price/calculator'

import { useMutation } from '@tanstack/react-query'

type Props = {
  toggle: boolean
  onToggle: () => void
}

export const PublishingFields = ({ toggle: expanded, onToggle }: Props) => {
  const { formatMessage } = useFormatMessage()
  const trpc = useTRPC()

  const { currentCase, refetch, canEdit, handleOptimisticUpdate } =
    useCaseContext()

  const createdAt = new Date(currentCase.createdAt)

  const { md } = useBreakpoint()

  const updateFasttrackMutation = useMutation(
    trpc.updateFasttrack.mutationOptions({
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
    }),
  )

  const updatePublishDateMutation = useMutation(
    trpc.updatePublishDate.mutationOptions({
      onSuccess: () => {
        toast.success('Dagsetning auglýsingar hefur verið uppfærð', {
          toastId: 'dateUpdatePublishing',
        })
        refetch()
      },
      onError: () => {
        toast.error('Ekki tókst að uppfæra dagsetningu auglýsingar')
      },
    }),
  )

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
          {updatePublishDateMutation.isPending ? (
            <SkeletonLoader height={64} borderRadius="large" />
          ) : (
            <DatePicker
              disabled={!canEdit}
              key={currentCase.requestedPublicationDate}
              locale="is"
              size="sm"
              backgroundColor="blue"
              minDate={new Date()}
              placeholderText="Dagsetning birtingar"
              selected={new Date(currentCase.requestedPublicationDate)}
              label={formatMessage(messages.grunnvinnsla.publicationDate)}
              handleChange={(date) => {
                const publishingDate = date.toISOString()
                handleOptimisticUpdate(
                  { ...currentCase, requestedPublicationDate: publishingDate },
                  () =>
                    updatePublishDateMutation.mutateAsync({
                      id: currentCase.id,
                      date: publishingDate,
                    }),
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
                  () =>
                    updateFasttrackMutation.mutateAsync({
                      id: currentCase.id,
                      fastTrack: e.target.checked,
                    }),
                )
              }}
            />
          </Inline>
        </Inline>
        <Divider weight="faded" />
        {!currentCase?.isLegacy && <PriceCalculator />}
      </Stack>
    </AccordionItem>
  )
}
