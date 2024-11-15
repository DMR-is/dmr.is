import { useRouter } from 'next/router'

import { Button, LinkV2 } from '@island.is/island-ui/core'

import { useUpdatePreviousCaseStatus } from '../../hooks/api'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { Routes } from '../../lib/constants'
import { messages } from '../../lib/messages/caseSingle'
import { CaseStep, caseSteps } from '../../lib/utils'

type Props = {
  caseId: string
  caseStep: CaseStep
  currentStatus: string
  refetch?: () => void
}

export const PrevStep = ({
  caseId,
  caseStep,
  currentStatus,
  refetch,
}: Props) => {
  const { formatMessage } = useFormatMessage()

  const prevStep =
    caseSteps.indexOf(caseStep) > 0
      ? caseSteps[caseSteps.indexOf(caseStep) - 1]
      : undefined

  const router = useRouter()

  const { trigger: onUpdatePreviousStatus, isMutating } =
    useUpdatePreviousCaseStatus({
      caseId: caseId,
      options: {
        onSuccess: () => {
          refetch && refetch()
          router.push(`/ritstjorn/${caseId}/${prevStep}`)
        },
      },
    })

  return (
    <>
      {prevStep ? (
        <Button
          loading={isMutating}
          as="span"
          variant="ghost"
          unfocusable
          onClick={() =>
            onUpdatePreviousStatus({
              currentStatus: currentStatus,
            })
          }
        >
          {formatMessage(messages.paging.goBack)}
        </Button>
      ) : (
        <Button
          as="span"
          variant="ghost"
          unfocusable
          onClick={() => router.push(`${Routes.ProcessingOverview}`)}
        >
          {formatMessage(messages.paging.goBackOverview)}
        </Button>
      )}
    </>
  )
}
