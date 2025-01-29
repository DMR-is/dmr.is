import { Stack } from '@island.is/island-ui/core'

import { Case, CaseStatusEnum } from '../../gen/fetch'
import { generateCaseLink } from '../../lib/utils'
import { CaseCard } from '../cards/CaseCard'

type Props = {
  cases: Case[]
}

export const CasePublishingList = ({ cases }: Props) => {
  return (
    <Stack space={[2, 2, 3]}>
      {cases.map((c) => (
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
            c.status.title as unknown as CaseStatusEnum,
            c.id,
          )}
        />
      ))}
    </Stack>
  )
}
