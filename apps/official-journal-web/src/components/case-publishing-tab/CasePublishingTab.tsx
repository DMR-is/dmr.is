import { Box, Button, Text } from '@island.is/island-ui/core'

import { Case, Paging } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { CaseTableReady } from '../tables/CaseTableReady'
import { CaseTableSelectedCases } from '../tables/CaseTableSelectedCases'
import { messages } from './messages'

type Props = {
  cases: Case[]
  paging: Paging
  selectedCases: Case[]
  setSelectedCases: React.Dispatch<React.SetStateAction<Case[]>>
  onContinue: (selectedCases: Case[]) => void
  casesReadyForPublication: Case[]
  setCasesReadyForPublication: React.Dispatch<React.SetStateAction<Case[]>>
}

export const CasePublishingTab = ({
  cases,
  paging,
  onContinue,
  selectedCases,
  setSelectedCases,
  casesReadyForPublication,
  setCasesReadyForPublication,
}: Props) => {
  const { formatMessage } = useFormatMessage()

  return (
    <>
      <Box>
        <CaseTableReady
          selectedCases={selectedCases}
          setSelectedCases={setSelectedCases}
          setCasesReadyForPublication={setCasesReadyForPublication}
          data={cases}
          paging={paging}
        />
      </Box>

      <Box marginTop={[3, 4]}>
        <Text as="h3" fontWeight="semiBold" marginBottom={2}>
          {formatMessage(messages.general.selectedCasesForPublishing)}
        </Text>
        <CaseTableSelectedCases data={casesReadyForPublication} />

        <Box marginTop={3} display="flex" justifyContent="flexEnd">
          <Button
            onClick={() => onContinue(casesReadyForPublication)}
            disabled={casesReadyForPublication.length === 0}
          >
            {formatMessage(messages.general.publishCases)}
          </Button>
        </Box>
      </Box>
    </>
  )
}
