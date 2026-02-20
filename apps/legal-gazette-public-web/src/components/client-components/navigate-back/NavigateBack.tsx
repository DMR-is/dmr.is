'use client'

import { useRouter } from 'next/navigation'

import { Button } from '@dmr.is/ui/components/island-is/Button'

type Props = {
  url?: string
}

export const NavigateBack = ({ url }: Props) => {
  const router = useRouter()

  const handleClick = () => {
    if (url) {
      router.push(url)
    } else {
      router.back()
    }
  }

  return (
    <Button
      onClick={handleClick}
      size="small"
      variant="text"
      preTextIcon="arrowBack"
      preTextIconType="outline"
    >
      Til baka
    </Button>
  )
}
