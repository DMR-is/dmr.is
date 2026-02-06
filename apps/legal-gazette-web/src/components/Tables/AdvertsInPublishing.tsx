'use client'

import React, { useCallback, useState } from 'react'
import { useIntl } from 'react-intl'

import {
  Button,
  Checkbox,
  Inline,
  Stack,
  Tag,
  Text,
  toast,
} from '@dmr.is/ui/components/island-is'
import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'
import {
  formatDate,
  getDaysSinceOrTo,
  getIcelandicDative,
} from '@dmr.is/utils/client'

import { useFilterContext } from '../../hooks/useFilters'
import { ritstjornTableMessages } from '../../lib/messages/ritstjorn/tables'
import { useTRPC } from '../../lib/trpc/client/trpc'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export const AdvertsInPublishing = () => {
  const { formatMessage } = useIntl()
  const { params, setParams } = useFilterContext()
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [selectedAdvertIds, setSelectedAdvertIds] = useState<string[]>([])

  const { mutate: bulkPublish, isPending: isBulkPublishing } = useMutation(
    trpc.publishNextBulk.mutationOptions({
      onMutate: async ({ advertIds }) => {
        toast.info(
          `Birti ${advertIds.length} ${advertIds.length === 1 ? 'birtingu' : 'birtingar'}...`,
          { toastId: 'publishing-adverts' },
        )
      },
      onSuccess: (_data, { advertIds }) => {
        setSelectedAdvertIds([])
        toast.success(`Birting fyrir ${advertIds.length} tókst`, {
          toastId: 'publish-adverts-success',
        })

        queryClient.invalidateQueries(
          trpc.getAdvertsCount.queryFilter(),
        )

        queryClient.invalidateQueries(
          trpc.getInPublishingAdverts.queryFilter(),
        )
      },
      onError: () => {
        toast.error('Ekki tókst að birta auglýsingar', {
          toastId: 'publish-adverts-error',
        })
      },
    }),
  )

  const { data } = useQuery(
    trpc.getInPublishingAdverts.queryOptions({
      categoryId: params.categoryId,
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      typeId: params.typeId,
      direction: params.direction ?? undefined,
      sortBy: params.sortBy ?? undefined,
    }),
  )

  const toggleAllAdverts = useCallback(() => {
    if (selectedAdvertIds.length === data?.adverts.length) {
      setSelectedAdvertIds([])
    } else {
      setSelectedAdvertIds(data?.adverts.map((ad) => ad.id) || [])
    }
  }, [data, selectedAdvertIds])

  const handleAdvertSelect = useCallback(
    (advertId: string, checked: boolean) => {
      if (checked) {
        setSelectedAdvertIds((prev) => [...prev, advertId])
      } else {
        setSelectedAdvertIds((prev) => prev.filter((id) => id !== advertId))
      }
    },
    [setSelectedAdvertIds],
  )

  const columns = [
    {
      field: 'id',
      children: (
        <Checkbox
          label=""
          onChange={() => toggleAllAdverts()}
          checked={selectedAdvertIds.length === data?.adverts.length}
        />
      ),
      size: 'tiny' as const,
    },
    {
      field: 'lastPublished',
      children: 'Siðast birt',
    },
    {
      field: 'scheduledAt',
      children: (
        <Text variant="medium" fontWeight="semiBold" whiteSpace="nowrap">
          Næsta birting
        </Text>
      ),
    },
    {
      field: 'schedule',
      children: 'Áætlun',
    },
    {
      field:'count',
      children: 'Fjöldi birtinga',
    },
    {
      field: 'efni',
      children: formatMessage(ritstjornTableMessages.columns.content),
    },
    {
      field: 'sender',
      children: formatMessage(ritstjornTableMessages.columns.sender),
    },
  ]

  const rows =
    data?.adverts
      .map((advert) => {
        if (!advert.scheduledAt) return null

        const days = getDaysSinceOrTo(advert.scheduledAt)

        const pubCount = advert.publications.length
        const publishedCount = advert.publications.filter((pub) => pub.publishedAt).length

        let tagText = ''
        let tagVariant: React.ComponentProps<typeof Tag>['variant'] = 'blue'
        if (days === -1) {
          tagText = 'Í gær'
          tagVariant = 'rose'
        } else if (days < -1) {
          tagText = `Fyrir ${Math.abs(days)} ${getIcelandicDative(Math.abs(days))} síðan`
          tagVariant = 'red'
        } else if (days === 0) {
          tagText = 'Í dag'
          tagVariant = 'mint'
        } else if (days === 1) {
          tagText = 'Á morgun'
          tagVariant = 'blue'
        } else {
          tagText = `Eftir ${days} daga`
          tagVariant = 'blue'
        }

        return {
          id: (
            <Checkbox
              checked={selectedAdvertIds.includes(advert.id)}
              onChange={(evt) =>
                handleAdvertSelect(advert.id, evt.target.checked)
              }
            />
          ),
          lastPublished: advert.lastPublishedAt ? (
            <Text variant="medium" whiteSpace="nowrap">
              {formatDate(advert.lastPublishedAt, 'dd.MM.yyyy')}
            </Text>
          ) : (
            'Enginn fyrri birting'
          ),
          scheduledAt: advert.scheduledAt ? (
            <Text variant="medium" whiteSpace="nowrap">
              {formatDate(advert.scheduledAt, 'dd.MM.yyyy')}
            </Text>
          ) : (
            'Engin útgáfudagsetning skráð'
          ),
          schedule: (
            <Tag variant={tagVariant} disabled>
              {tagText}
            </Tag>
          ),
          count: `${publishedCount} / ${pubCount}`,
          tegund: advert.type.title,
          efni: advert.title,
          sender: advert.createdBy,
          href: `/ritstjorn/${advert.id}`,
          hasLink: true,
        }
      })
      .filter((row): row is NonNullable<typeof row> => row !== null) || []

  return (
    <Stack space={[2, 3]}>
      <DataTable
        columns={columns}
        rows={rows}
        paging={data?.paging}
        onPageChange={(page) => setParams({ page: page })}
        onPageSizeChange={(pageSize) => setParams({ pageSize: pageSize })}
        showPageSizeSelect={true}
      />
      <Inline align="right">
        <Button
          onClick={() => bulkPublish({ advertIds: selectedAdvertIds })}
          loading={isBulkPublishing}
          icon="arrowForward"
          disabled={!selectedAdvertIds.length}
        >
          {`Gefa út ${selectedAdvertIds.length} ${selectedAdvertIds.length === 1 ? 'birtingu' : 'birtingar'}`}
        </Button>
      </Inline>
    </Stack>
  )
}
