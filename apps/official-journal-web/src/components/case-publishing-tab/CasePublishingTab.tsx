import { useState } from 'react'

import { Box, Button, Text } from '@island.is/island-ui/core'

import { Case } from '../../gen/fetch'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import {
  CaseReadyForPublishing,
  CaseTableReady,
} from '../tables/CaseTableReady'
import { CaseTableSelectedCases } from '../tables/CaseTableSelectedCases'
import { messages } from './messages'

type Props = {
  cases: Case[]
  selectedCases: CaseReadyForPublishing[]
  setSelectedCases: React.Dispatch<
    React.SetStateAction<CaseReadyForPublishing[]>
  >
  onContinue: (selectedCases: CaseReadyForPublishing[]) => void
  casesReadyForPublication: CaseReadyForPublishing[]
  setCasesReadyForPublication: React.Dispatch<
    React.SetStateAction<CaseReadyForPublishing[]>
  >
}

export const CasePublishingTab = ({
  cases,
  onContinue,
  selectedCases,
  setSelectedCases,
  casesReadyForPublication,
  setCasesReadyForPublication,
}: Props) => {
  const { formatMessage } = useFormatMessage()

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
      <CaseTableReady
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
          {formatMessage(messages.general.preparePublishing)}
        </Button>
      </Box>

      <Text as="h3" fontWeight="semiBold" marginBottom={2}>
        {formatMessage(messages.general.selectedCasesForPublishing)}
      </Text>
      <CaseTableSelectedCases data={casesReadyForPublication} />
      {casesReadyForPublication.length > 0 && (
        <Box marginTop={3} display="flex" justifyContent="flexEnd">
          <Button onClick={() => onContinue(casesReadyForPublication)}>
            {formatMessage(messages.general.publishCases)}
          </Button>
        </Box>
      )}
    </Box>
  )
}
