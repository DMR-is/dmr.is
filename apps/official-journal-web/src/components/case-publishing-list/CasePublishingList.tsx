import { Stack } from '@island.is/island-ui/core'

import { Case } from '../../gen/fetch'
import { CaseCard } from '../cards/CaseCard'

type Props = {
  cases: Case[]
}

export const CasePublishingList = ({ cases }: Props) => {
  return (
    <Stack space={3} component="ul">
      {cases.map((c, i) => (
        <CaseCard
          key={i}
          department={c.advert.department.title}
          // publicationDate={c.advert.publicationDate}
          publicationDate="2024-10-19 00:00:00.000"
          insitiution={c.advert.involvedParty.title}
          caseNumber={`${c.caseNumber}/${c.year}`}
          title={c.advert.title}
          categories={c.advert.categories.map((cat) => cat.title)}
        />
      ))}
    </Stack>
  )
}