'use client'

import addYears from 'date-fns/addYears'

import { useQuery } from '@dmr.is/trpc/client/trpc'
import { Modal } from '@dmr.is/ui/components/Modal/Modal'
import {
  getInvalidPublishingDatesInRange,
  getNextValidPublishingDate,
} from '@dmr.is/utils/client/dateUtils'

import { useTRPC } from '../../lib/trpc/client/trpc'

import { useMutation, useQueryClient } from '@tanstack/react-query'

type Props = {
  applicationId: string
  title?: string
  isVisible: boolean
  onVisibilityChange(isVisible: boolean): void
}

export const CreateDivisionEnding = ({
  applicationId,
  title,
  isVisible,
  onVisibilityChange,
}: Props) => {
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

  return <Modal>hello</Modal>
}
