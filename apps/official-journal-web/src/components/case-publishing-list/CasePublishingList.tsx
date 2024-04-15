import { Stack } from '@island.is/island-ui/core'

import { Case } from '../../gen/fetch'
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
          department={c.advert.department.title}
          // publicationDate={c.advert.publicationDate}
          publicationDate={c.advert.publicationDate}
          insitiution={c.advert.involvedParty.title}
          publicationNumber={c.advert.publicationNumber?.full}
          title={c.advert.title}
          categories={c.advert.categories.map((cat) => cat.title)}
        />
      ))}
    </Stack>
  )
}
