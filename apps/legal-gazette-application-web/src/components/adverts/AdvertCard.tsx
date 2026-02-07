'use client'

import { useState } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Tag } from '@dmr.is/ui/components/island-is/Tag'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { formatDate } from '@dmr.is/utils/client'

import { AdvertPublicationModal } from '../modals/AdvertPublicationModal'

// Type that matches the API response (dates as strings from JSON)
export type AdvertCardData = {
  id: string
  legacyId: string | null
  title: string
  publicationNumber: string | null
  type: { id: string; title: string; slug: string }
  category: { id: string; title: string; slug: string }
  status: { id: string; title: string; slug: string }
  createdAt: string | Date
  publishedAt: string | Date | null
  html: string | null
}

type Props = {
  advert: AdvertCardData
}

export const AdvertCard = ({ advert }: Props) => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const statusText = advert.status?.title ?? 'Óþekkt'

  const getStatusVariant = (): 'blue' | 'mint' | 'blueberry' | 'rose' => {
    switch (advert.status?.slug) {
      case 'submitted':
        return 'blue'
      case 'active':
      case 'published':
        return 'mint'
      case 'in-progress':
        return 'blueberry'
      case 'rejected':
        return 'rose'
      default:
        return 'blue'
    }
  }

  const isLegacy = advert.legacyId !== null

  return (
    <>
      <Box
        borderRadius="large"
        border="standard"
        padding={3}
        background="white"
      >
        <Stack space={[1, 0]}>
          <Inline justifyContent="spaceBetween" space={1}>
            <Text color="purple400" variant="eyebrow">
              {advert.publishedAt
                ? `Birt: ${formatDate(advert.publishedAt)}`
                : `Stofnuð: ${formatDate(advert.createdAt)}`}
              {advert.publicationNumber && ` | Nr. ${advert.publicationNumber}`}
            </Text>
            <Inline space={1}>
              {isLegacy && (
                <Tag variant="darkerBlue" outlined disabled>
                  Eldri auglýsing
                </Tag>
              )}
              <Tag variant={getStatusVariant()} disabled>
                {statusText}
              </Tag>
            </Inline>
          </Inline>

          <Stack space={1}>
            <Text variant="h3">{advert.title}</Text>
            <Inline
              justifyContent="spaceBetween"
              alignY="center"
              space={1}
              collapseBelow="sm"
            >
              <Text variant="medium">
                {advert.type?.title} - {advert.category?.title}
              </Text>
              {advert.html && (
                <Button
                  variant="text"
                  icon="document"
                  iconType="outline"
                  size="small"
                  onClick={() => setIsModalOpen(true)}
                >
                  Skoða
                </Button>
              )}
            </Inline>
          </Stack>
        </Stack>
      </Box>

      {advert.html && (
        <AdvertPublicationModal
          id={`advert-modal-${advert.id}`}
          html={advert.html}
          isLegacy
          isVisible={isModalOpen}
          onVisibilityChange={setIsModalOpen}
        />
      )}
    </>
  )
}
