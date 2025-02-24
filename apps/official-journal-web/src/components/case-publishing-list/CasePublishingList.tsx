import { AlertMessage, Stack, Text } from '@island.is/island-ui/core'

import { Case, CaseStatusEnum } from '../../gen/fetch'
import { formatDate, generateCaseLink } from '../../lib/utils'
import { CaseCard } from '../cards/CaseCard'

type Props = {
  cases: Case[]
}

export const CasePublishingList = ({ cases }: Props) => {
  return (
    <Stack space={[2, 2, 3]}>
      {cases.map((c) => {
        const today = new Date()

        const publicationDate = c.requestedPublicationDate

        const isPublicationDateToday = publicationDate
          ? new Date(publicationDate).toDateString() === today.toDateString()
          : false

        const isExpired = publicationDate
          ? new Date(publicationDate) < today
          : false

        const now = new Date()
        const diff = now.getTime() - new Date(publicationDate).getTime()

        const diffDays = Math.abs(Math.floor(diff / (1000 * 3600 * 24)))

        const message = isExpired
          ? ` var ${
              diffDays === 1 ? 'í gær' : 'fyrir ' + diffDays + ' dögum síðan'
            }`
          : ` er ${diffDays === -1 ? ' á morgun' : `eftir ${diffDays} daga`}`

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
              c.status.title as unknown as CaseStatusEnum,
              c.id,
            )}
            alert={
              !isPublicationDateToday && (
                <AlertMessage
                  type="error"
                  title="Birtingardagur er ekki í dag"
                  message={
                    <Stack space={2}>
                      <Text variant="small">
                        Umbeðinn birtingardagur er{' '}
                        {formatDate(c.requestedPublicationDate)} sem {message}
                      </Text>
                    </Stack>
                  }
                />
              )
            }
          />
        )
      })}
    </Stack>
  )
}
