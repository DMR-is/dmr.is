import { Stack } from '@island.is/island-ui/core'

import { CaseWithApplication } from '../../gen/fetch'
import { generateCaseLink } from '../../lib/utils'
import { CaseCard } from '../cards/CaseCard'

type Props = {
  cases: CaseWithApplication[]
}

export const CasePublishingList = ({ cases }: Props) => {
  return (
    <Stack space={3} component="ul">
      {cases.map((c) => (
        <CaseCard
          key={c.caseId}
          department={c.advertDepartment}
          // publicationDate={c.advert.publicationDate}
          publicationDate={c.requestedPublicationDate}
          insitiution={c.institutionTitle}
          publicationNumber={c.publicationNumber}
          title={c.advertTitle}
          // categories={c.advert.categories.map((cat) => cat.title)} TODO: add categories with case with application, and status
          // link={generateCaseLink(c.status, c.id)} TODO: add link with case with application
        />
      ))}
    </Stack>
  )
}
