import { Stack } from '@island.is/island-ui/core'

import { Case } from '../../gen/fetch'
// import { generateCaseLink } from '../../lib/utils'
import { CaseCard } from '../cards/CaseCard'

type Props = {
  cases: Case[]
}

export const CasePublishingList = ({ cases }: Props) => {
  return (
    <Stack space={3} component="ul">
      {cases.map((c) => (
        <CaseCard
          key={c.id}
          department={c.advertDepartment.title}
          publicationDate={c.requestedPublicationDate}
          insitiution={'Reykjavíkurborg'} // TODO: ADd involved party to case
          publicationNumber={`${c.caseNumber}`}
          title={c.advertTitle}
          // categories={c.advert.categories.map((cat) => cat.title)} TODO: add categories with case with application, and status
          // link={generateCaseLink(c.status, c.id)} TODO: add link with case with application
        />
      ))}
    </Stack>
  )
}
