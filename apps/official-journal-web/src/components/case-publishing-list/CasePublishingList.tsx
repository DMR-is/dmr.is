import {
  Box,
  Button,
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
} from '@island.is/island-ui/core'

import { Case } from '../../gen/fetch'
import { generateCaseLink } from '../../lib/utils'
import { CaseCard } from '../cards/CaseCard'

type Props = {
  casesToPublish: Case[]
  onPublish: (caseIds: string[]) => void
  onCancel: () => void
}

export const CasePublishingList = ({
  casesToPublish,
  onCancel,
  onPublish,
}: Props) => {
  return (
    <GridContainer>
      <GridRow>
        <GridColumn
          paddingTop={3}
          offset={['0', '0', '1/12', '1/12']}
          span={['12/12', '12/12', '8/12', '8/12']}
        >
          <Stack space={3} component="ul">
            {casesToPublish.map((c) => (
              <CaseCard
                key={c.id}
                department={c.advertDepartment.title}
                publicationDate={c.requestedPublicationDate}
                insitiution={c.involvedParty.title}
                publicationNumber={`${c.caseNumber}`}
                title={c.advertTitle}
                categories={c.advertCategories.map((c) => c.title)}
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
            <Button
              icon="arrowForward"
              onClick={() => onPublish(casesToPublish.map((c) => c.id))}
            >
              Gefa út öll mál
            </Button>
          </Box>
        </GridColumn>
      </GridRow>
    </GridContainer>
  )
}
