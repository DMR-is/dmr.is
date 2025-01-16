import { Box, Button, LinkV2, Stack } from '@island.is/island-ui/core'

import { Case, CaseStatusTitleEnum } from '../../gen/fetch'
import { Routes } from '../../lib/constants'
import { generateCaseLink } from '../../lib/utils'
import { CaseCard } from '../cards/CaseCard'

type Props = {
  cases: Case[]
}

export const CasePublishingList = ({ cases }: Props) => {
  return (
    <Stack space={[2, 2, 3]}>
      {cases.map((c) => {
        return (
          <CaseCard
            key={c.id}
            department={c.advertDepartment.title}
            publicationDate={c.requestedPublicationDate}
            year={c.year}
            insitiution={c.involvedParty.title}
            publicationNumber={c.publicationNumber}
            title={c.advertTitle}
            categories={c.advertCategories.map((c) => c.title)}
            link={generateCaseLink(
              c.status.title as unknown as CaseStatusTitleEnum,
              c.id,
            )}
          />
        )
      })}
      <Box
        marginTop={3}
        display="flex"
        flexWrap="wrap"
        justifyContent="spaceBetween"
      >
        <LinkV2 href={Routes.PublishingOverview}>
          <Button variant="ghost">Tilbaka í útgáfu mála</Button>
        </LinkV2>
        <Button icon="arrowForward">Gefa út öll mál</Button>
      </Box>
    </Stack>
  )
}
