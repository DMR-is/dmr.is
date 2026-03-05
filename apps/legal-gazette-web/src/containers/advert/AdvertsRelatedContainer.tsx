'use client'

import { useMemo } from 'react'

import { Button } from '@dmr.is/ui/components/island-is/Button'
import { LinkV2 } from '@dmr.is/ui/components/island-is/LinkV2'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { Route } from '../../lib/constants'
import { useTRPC } from '../../lib/trpc/client/trpc'

import { useQuery } from '@tanstack/react-query'

type Props = {
  caseId: string
  advertId: string
}

export const RelatedAdvertsContainer = ({ caseId, advertId }: Props) => {
  const trpc = useTRPC()

  const { data, isLoading, error } = useQuery(
    trpc.getRelatedAdverts.queryOptions({ caseId }),
  )

  const filtered = useMemo(() => {
    if (!data) return []

    return data.adverts.filter((ad) => ad.id !== advertId)
  }, [data, advertId])

  if (isLoading || error || filtered.length === 0) {
    return null
  }

  return (
    <Stack space={[1, 2]}>
      <Text variant="h4">Tengdar auglýsingar</Text>
      {filtered.map((ad) => (
        <LinkV2 href={Route.RITSTJORN_ID.replace('[id]', ad.id)}>
          <Button
            as="div"
            variant="text"
            size="small"
            key={ad.id}
            icon="arrowForward"
          >
            {ad.title}
          </Button>
        </LinkV2>
      ))}
    </Stack>
  )
}
