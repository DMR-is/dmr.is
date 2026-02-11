'use client'

import { useParams } from 'next/navigation'

import { Button, LinkV2 } from '@dmr.is/ui/components/island-is'

export const NavigateBack = () => {
  const params = useParams()

  const href = params?.publicationNumber !== undefined ? '/auglysingar' : '/'

  return (
    <LinkV2 href={href}>
      <Button
        as="div"
        size="small"
        variant="text"
        preTextIcon="arrowBack"
        preTextIconType="outline"
      >
        Til baka
      </Button>
    </LinkV2>
  )
}
