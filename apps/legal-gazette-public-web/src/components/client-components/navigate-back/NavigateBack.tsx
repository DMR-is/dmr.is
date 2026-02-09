'use client'

import { useParams, useRouter } from 'next/navigation'

import { Button } from '@dmr.is/ui/components/island-is/Button'
import { LinkV2 } from '@dmr.is/ui/components/island-is/LinkV2'

export const NavigateBack = () => {
  const params = useParams()
  const router = useRouter()

  const isDetailPage = params?.id !== undefined
  const href = isDetailPage ? '/auglysingar' : '/'

  return isDetailPage ? (
    <Button
      onClick={() => router.back()}
      size="small"
      variant="text"
      preTextIcon="arrowBack"
    >
      Til baka
    </Button>
  ) : (
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
