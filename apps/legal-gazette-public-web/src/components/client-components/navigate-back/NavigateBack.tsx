'use client'
import NextLink from 'next/link'
import { useParams, useRouter } from 'next/navigation'

import { Button } from '@dmr.is/ui/components/island-is'

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
    <NextLink href={href}>
      <Button
        as="div"
        size="small"
        variant="text"
        preTextIcon="arrowBack"
        preTextIconType="outline"
      >
        Til baka
      </Button>
    </NextLink>
  )
}
