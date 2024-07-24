import {
  AlertMessage,
  Box,
  Button,
  GridColumn,
  GridContainer,
  GridRow,
  SkeletonLoader,
  Stack,
} from '@island.is/island-ui/core'

import { useCases } from '../../hooks/api'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { messages as errorMessages } from '../../lib/messages/errors'
import { generateCaseLink } from '../../lib/utils'
import { CaseCard } from '../cards/CaseCard'

type Props = {
  caseIds: string[]
  onPublish: (caseIds: string[]) => void
  onCancel: () => void
}

export const CasePublishingList = ({ caseIds, onCancel, onPublish }: Props) => {
  if (caseIds.length === 0) {
    throw new Error('No case ids provided')
  }

  const { formatMessage: f } = useFormatMessage()

  const { data, isLoading, error } = useCases({
    params: {
      id: caseIds.join(','),
    },
    options: {
      refreshInterval: 0,
    },
  })

  if (isLoading) {
    return <SkeletonLoader height={120} repeat={3} />
  }

  if (error) {
    return (
      <AlertMessage
        type="error"
        title={f(errorMessages.error)}
        message={f(errorMessages.errorFetchingData)}
      />
    )
  }

  if (!data) {
    return (
      <AlertMessage
        type="error"
        title={f(errorMessages.noDataTitle)}
        message={f(errorMessages.noDataText)}
      />
    )
  }

  return (
    <GridContainer>
      <GridRow>
        <GridColumn
          paddingTop={3}
          offset={['0', '0', '1/12', '1/12']}
          span={['12/12', '12/12', '8/12', '8/12']}
        >
          <Stack space={3} component="ul">
            {data.cases.map((c) => (
              <CaseCard
                key={c.id}
                department={c.advertDepartment.title}
                publicationDate={c.requestedPublicationDate}
                insitiution={c.involvedParty.title}
                publicationNumber={`${c.caseNumber}`}
                title={c.advertTitle}
                categories={c.advertCategories.map((cat) => cat.title)}
                link={generateCaseLink(c.status, c.id)}
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
            <Button icon="arrowForward" onClick={() => onPublish(caseIds)}>
              Gefa út öll mál
            </Button>
          </Box>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
