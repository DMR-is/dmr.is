'use client'

import { useRouter } from 'next/navigation'

import { useState } from 'react'
import { Inline } from 'submodules/island.is/libs/island-ui/core/src/lib/Inline/Inline'

import { Icon, Tag } from '@dmr.is/ui/components/island-is'
import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'
import { DataTableColumnProps } from '@dmr.is/ui/components/Tables/DataTable/types'
import { formatDate } from '@dmr.is/utils/client'

import { AdvertDto } from '../../gen/fetch'
import { ApplicationTypeEnum } from '../../gen/fetch'
import { DateFormats } from '../../lib/constants'
import { useTRPC } from '../../lib/trpc/client/trpc'
import { cardTagButtonStyle } from '../application/application.css'
import { RemoveApplicationAdvert } from '../application/RemoveApplicationAdvert'
import { AdvertPublications } from './AdvertPublications'

import { useQueryClient } from '@tanstack/react-query'

type Props = {
  adverts: AdvertDto[]
  applicationId: string
  type?: ApplicationTypeEnum
}

export const AdvertTable = ({
  adverts,
  applicationId,
  type = ApplicationTypeEnum.COMMON,
}: Props) => {
  const router = useRouter()
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const [openModal, setOpenModal] = useState(false)
  const [selectedAdvertId, setSelectedAdvertId] = useState<string | undefined>(
    undefined,
  )

  const columns: DataTableColumnProps[] = [
    {
      field: 'createdAt',
      children: 'Skráning',
      size: 'tiny',
    },
    {
      field: 'category',
      children: 'Flokkur',
      size: 'tiny',
    },
    {
      field: 'type',
      children: 'Tegund',
      size: 'tiny',
    },
    {
      field: 'title',
      children: 'Efni',
    },
    {
      field: 'actions',
      children: '',
    },
  ]

  const openRemoveAdvertModal = (id: string) => {
    // if not common advert, set the selected advert id so that a single advert can be removed
    if (type !== ApplicationTypeEnum.COMMON) {
      setSelectedAdvertId(id)
    } else {
      setSelectedAdvertId(undefined)
    }
    setOpenModal(true)
  }

  const onRemoveAdvert = () => {
    if (adverts.length === 1) {
      router.replace('/')
    } else {
      queryClient.invalidateQueries(trpc.getAdvertByCaseId.queryFilter())
    }
  }

  const isPublished = (ad: AdvertDto) => {
    return ad.status.slug === 'utgefid'
  }

  const isAllPublished = (ad: AdvertDto) => {
    let publishedCount = 0
    ad.publications.forEach((pub) => {
      if (pub.publishedAt) {
        publishedCount++
      }
    })

    return publishedCount === ad.publications.length
  }

  const isRejected = (ad: AdvertDto) => {
    return ad.status.slug === 'hafnad'
  }
  return (
    <>
      <DataTable
        noDataMessage="Engar auglýsingar fundust"
        columns={columns}
        rows={adverts.map((ad, index) => ({
          createdAt: formatDate(ad.createdAt, DateFormats.DEFAULT),
          category: ad.category.title,
          type: ad.type.title,
          title: ad.title,
          children: <AdvertPublications advert={ad} />,
          isExpandable: true,
          startExpanded: index === adverts.length - 1,
          actions: (
            <Inline justifyContent={'flexEnd'}>
              {!isPublished(ad) && !isRejected(ad) ? (
                <button
                  style={{ display: 'inline-block' }}
                  className={cardTagButtonStyle}
                  title="Afturkalla"
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                  }}
                >
                  <Tag
                    variant="red"
                    onClick={() => openRemoveAdvertModal(ad.id)}
                  >
                    <Icon
                      icon="trash"
                      type="outline"
                      size="small"
                      color="red600"
                    />
                  </Tag>
                </button>
              ) : isAllPublished(ad) ? (
                <Tag variant="mint" disabled>
                  Útgefin
                </Tag>
              ) : isRejected(ad) ? (
                <Tag variant="red" disabled>
                  Hafnað
                </Tag>
              ) : null}
            </Inline>
          ),
        }))}
      />
      {openModal && (
        <RemoveApplicationAdvert
          applicationId={applicationId}
          advertId={selectedAdvertId}
          type={type}
          openModal={openModal}
          setOpenModal={setOpenModal}
          onSuccess={onRemoveAdvert}
        />
      )}
    </>
  )
}
