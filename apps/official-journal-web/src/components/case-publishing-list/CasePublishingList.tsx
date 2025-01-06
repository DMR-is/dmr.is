import {
  AlertMessage,
  Box,
  Button,
  SkeletonLoader,
  Stack,
} from '@island.is/island-ui/core'

import { CaseStatusTitleEnum } from '../../gen/fetch'
import { useCases } from '../../hooks/api'
import { usePublishCases } from '../../hooks/api/post/usePublishCases'
import { usePublishContext } from '../../hooks/usePublishContext'
import { generateCaseLink } from '../../lib/utils'
import { CaseCard } from '../cards/CaseCard'

type Props = {
  onPublish?: (caseIds: string[]) => void
  onPublishSuccess?: () => void
  onError?: (error: unknown) => void
  onCancel: () => void
}

export const CasePublishingList = ({
  onCancel,
  onPublish,
  onError,
  onPublishSuccess,
}: Props) => {
  const {
    publishingState,
    setCasesWithPublicationNumber,
    removeAllCasesFromSelectedList,
  } = usePublishContext()
  const { casesWithPublishingNumber } = publishingState

  const {
    trigger: publishCases,
    error: publishError,
    isMutating: isPublishing,
  } = usePublishCases({
    onSuccess: () => {
      removeAllCasesFromSelectedList()
      setCasesWithPublicationNumber([])
      if (onPublishSuccess) {
        onPublishSuccess()
      }
    },
    onError: (error) => {
      onError && onError(error)
    },
  })

  const ids = casesWithPublishingNumber.map((c) => c.id)

  const { data, error, isLoading } = useCases({
    options: {
      refreshInterval: 0,
    },
    params: {
      status: [CaseStatusTitleEnum.Tilbúið],
      id: [...ids],
    },
  })

  if (isLoading) {
    return <SkeletonLoader repeat={3} height={88} space={2} />
  }

  if (error) {
    return (
      <AlertMessage
        type="error"
        title="Villa kom upp!"
        message="Ekki tókst að sækja mál til útgáfu"
      />
    )
  }

  if (!data) {
    return (
      <AlertMessage
        type="error"
        title="Engin mál fundust"
        message="Ertu búin að velja mál til útgáfu?"
      />
    )
  }

  const withPublicationNumber = data.cases
    .map((c) => ({
      ...c,
      publishingNumber:
        casesWithPublishingNumber.find((cc) => cc.id === c.id)
          ?.publishingNumber || 0,
    }))
    .sort((a, b) => a.publishingNumber - b.publishingNumber)

  return (
    <>
      {publishError && (
        <Box marginBottom={3}>
          <AlertMessage
            type="error"
            title="Villa kom upp!"
            message="Ekki tókst að gefa út mál"
          />
        </Box>
      )}
      <Stack space={3} component="ul">
        {withPublicationNumber.map((c) => (
          <CaseCard
            key={c.id}
            department={c.advertDepartment.title}
            publicationDate={c.requestedPublicationDate}
            insitiution={c.involvedParty.title}
            publicationNumber={`${c.publishingNumber}/${c.year}`}
            title={c.advertTitle}
            categories={c.advertCategories.map((c) => c.title)}
            link={generateCaseLink(c.status.title, c.id)}
          />
        ))}
      </Stack>
      <Box
        marginTop={3}
        display="flex"
        flexWrap="wrap"
        justifyContent="spaceBetween"
      >
        <Button variant="ghost" onClick={onCancel}>
          Tilbaka í útgáfu mála
        </Button>
        <Button
          loading={isPublishing}
          icon="arrowForward"
          onClick={() => {
            if (onPublish) {
              onPublish(withPublicationNumber.map((c) => c.id))
            }
            publishCases({
              caseIds: withPublicationNumber.map((c) => c.id),
            })
          }}
        >
          Gefa út öll mál
        </Button>
      </Box>
    </>
  )
}
