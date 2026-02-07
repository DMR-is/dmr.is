'use client'

import { useState } from 'react'

import { Button } from '@dmr.is/ui/components/island-is/Button'
import { PagingTotalItemsText } from '@dmr.is/ui/components/PagingTotaItemsText/PagingTotalItemsText'

import { CombinedHTMLModal } from '../components/client-components/search-page/results/CombinedHTMLModal'
import { usePublicationsHtml } from '../hooks/usePublicationsHtml'

type Props = {
  disabled?: boolean
  pagingInfo?: React.ComponentProps<typeof PagingTotalItemsText>
}

export const CombinedHTMLModalContainer = ({ disabled, pagingInfo }: Props) => {
  const [enable, setEnable] = useState(false)
  const { html } = usePublicationsHtml({ enable })

  const handleVisibilityChange = (isVisible: boolean) => {
    if (!isVisible) {
      setEnable(false)
    }
  }

  const disclosure = (
    <Button
      colorScheme="light"
      icon="documents"
      iconType="outline"
      variant="utility"
      disabled={disabled}
      onClick={() => setEnable((prev) => !prev)}
    >
      Skoða auglýsingar á síðu
    </Button>
  )

  return (
    <CombinedHTMLModal
      pagingInfo={pagingInfo}
      disclosure={disclosure}
      publicationsHtml={html}
      onVisibilityChange={handleVisibilityChange}
    />
  )
}
