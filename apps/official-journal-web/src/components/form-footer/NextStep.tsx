import { useRouter } from 'next/router'

import { Box, Button } from '@island.is/island-ui/core'

import { useUpdateNextCaseStatus } from '../../hooks/api'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { Routes } from '../../lib/constants'
import { messages } from '../../lib/messages/caseSingle'
import { CaseStep, caseSteps } from '../../lib/utils'

type Props = {
  caseId: string
  fixStep: boolean
  isAssigned?: boolean | null
  caseStep: CaseStep
  currentStatus: string
  refetch?: () => void
}

export const NextStep = ({
  caseId,
  fixStep,
  isAssigned,
  caseStep,
  currentStatus,
  refetch,
}: Props) => {
  const { formatMessage } = useFormatMessage()
  const nextStep =
    caseSteps.indexOf(caseStep) < 3
      ? caseSteps[caseSteps.indexOf(caseStep) + 1]
      : undefined

  const router = useRouter()

  const { trigger: onUpdateNextCaseStatus, isMutating } =
    useUpdateNextCaseStatus({
      caseId: caseId,
      options: {
        onSuccess: () => {
          refetch && refetch()
          router.replace(`/ritstjorn/${caseId}/${nextStep}`)
        },
      },
    })

  if (fixStep) {
    return null
  }

  return nextStep ? (
    <Button
      disabled={!isAssigned}
      loading={isMutating}
      as="span"
      icon="arrowForward"
      onClick={() =>
        onUpdateNextCaseStatus({
          currentStatus: currentStatus,
        })
      }
      unfocusable
    >
      {formatMessage(messages.paging.nextStep)}
    </Button>
  ) : (
    <Box display="flex" rowGap={2} columnGap={2} flexWrap="wrap">
      <Button
        as="span"
        variant="ghost"
        unfocusable
        onClick={() => router.replace(`${Routes.ProcessingOverview}`)}
      >
        {formatMessage(messages.paging.goBackOverview)}
      </Button>
      <Button onClick={() => router.push(`${Routes.PublishingOverview}`)}>
        {formatMessage(messages.paging.toPublishing)}
      </Button>
    </Box>
  )
}
