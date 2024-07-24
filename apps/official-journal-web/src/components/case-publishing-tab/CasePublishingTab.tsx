import { Box, Button, Text } from '@island.is/island-ui/core'

import { Case, Paging } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { usePublishContext } from '../../hooks/usePublishContext'
import { CaseTableReady } from '../tables/CaseTableReady'
import { CaseTableSelectedCases } from '../tables/CaseTableSelectedCases'
import { messages } from './messages'

type Props = {
  cases: Case[]
  paging: Paging
  proceedToPublishing: (casesToPublish: string[]) => void
}

export const CasePublishingTab = ({ proceedToPublishing }: Props) => {
  const { formatMessage } = useFormatMessage()

  const { publishingState } = usePublishContext()
  const { selectedCaseIds } = publishingState

  return (
    <Box display="flex" flexDirection="column" rowGap={4}>
      <Box>
        <CaseTableReady />
      </Box>

      <Box>
        <Text as="h3" fontWeight="semiBold" marginBottom={2}>
          {formatMessage(messages.general.selectedCasesForPublishing)}
        </Text>
        <CaseTableSelectedCases />

        <Box marginTop={3} display="flex" justifyContent="flexEnd">
          <Button
            disabled={selectedCaseIds.length === 0}
            onClick={() => proceedToPublishing(selectedCaseIds)}
          >
            {formatMessage(messages.general.publishCases)}
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
