import { useState } from 'react'

import { Box, Button, Text } from '@island.is/island-ui/core'

import { Case } from '../../gen/fetch'
import {
  CaseReadyForPublishing,
  CaseTablePublishing,
} from '../tables/CaseTablePublishing'
import { CaseTableSelectedCases } from '../tables/CaseTableSelectedCases'

type Props = {
  cases: Case[]
  onContinue: (selectedCases: CaseReadyForPublishing[]) => void
}

export const CasePublishingTab = ({ cases, onContinue }: Props) => {
  const [selectedCases, setSelectedCases] = useState<CaseReadyForPublishing[]>(
    [],
  )

  const [casesReadyForPublication, setCasesReadyForPublication] = useState<
    CaseReadyForPublishing[]
  >([])

  const data = cases.map((item) => {
    return {
      id: item.id,
      labels: item.fastTrack ? ['fasttrack'] : [],
      title: item.advert.title,
      caseNumber: `${item.caseNumber}/${item.year}`,
      publicationDate: item.advert.publicationDate,
      institution: item.advert.involvedParty.title,
    }
  })

  return (
    <Box>
      <CaseTablePublishing
        selectedCases={selectedCases}
        setSelectedCases={setSelectedCases}
        data={data}
      />
      <Box marginTop={3} display="flex" justifyContent="flexEnd">
        <Button
          variant="ghost"
          disabled={
            !selectedCases.length && casesReadyForPublication.length === 0
          }
          icon="arrowDown"
          onClick={() => setCasesReadyForPublication(selectedCases)}
        >
          Undirbúa útgáfu
        </Button>
      </Box>

      <Text as="h3" fontWeight="semiBold" marginBottom={2}>
        Valin mál til útgáfu:
      </Text>
      <CaseTableSelectedCases data={casesReadyForPublication} />
      {casesReadyForPublication.length > 0 && (
        <Box marginTop={3} display="flex" justifyContent="flexEnd">
          <Button onClick={() => onContinue(casesReadyForPublication)}>
            Gefa út valin mál
          </Button>
        </Box>
      )}
    </Box>
  )
}
