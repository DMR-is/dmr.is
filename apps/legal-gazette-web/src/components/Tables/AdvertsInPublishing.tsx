'use client'

import React from 'react'
import { useIntl } from 'react-intl'

import {
  Button,
  Checkbox,
  Inline,
  Stack,
  Tag,
  Text,
} from '@dmr.is/ui/components/island-is'
import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'
import {
  formatDate,
  getDaysDelta,
  getIcelandicDative,
} from '@dmr.is/utils/client'

import { useAdvertSelection } from '../../hooks/useAdvertSelection'
import { useBulkPublish } from '../../hooks/useBulkPublish'
import { useFilterContext } from '../../hooks/useFilters'
import { ritstjornTableMessages } from '../../lib/messages/ritstjorn/tables'
import { useTRPC } from '../../lib/trpc/client/trpc'

import { useQuery } from '@tanstack/react-query'

export const AdvertsInPublishing = () => {
  const { formatMessage } = useIntl()
  const { params, setParams } = useFilterContext()
  const trpc = useTRPC()

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

  const {
    selectedAdvertIds,
    toggleAllAdverts,
    handleAdvertSelect,
    clearSelection,
  } = useAdvertSelection(data?.adverts.length)

  const { publishNextBulk, isPending: isBulkPublishing } = useBulkPublish({
    onSuccess: clearSelection,
  })

  const columns = [
    {
      field: 'id',
      children: (
        <Checkbox
          label=""
          disabled={!data?.adverts.length}
          onChange={() => toggleAllAdverts(data?.adverts)}
          checked={
            selectedAdvertIds.length === data?.adverts.length &&
            data?.adverts.length > 0
          }
        />
      ),
      size: 'tiny' as const,
    },
    {
      field: 'lastPublished',
      children: formatMessage(ritstjornTableMessages.publishing.lastPublished),
    },
    {
      field: 'scheduledAt',
      children: (
        <Text variant="medium" fontWeight="semiBold" whiteSpace="nowrap">
          {formatMessage(ritstjornTableMessages.publishing.nextPublishing)}
        </Text>
      ),
    },
    {
      field: 'schedule',
      children: formatMessage(ritstjornTableMessages.publishing.schedule),
    },
    {
      field: 'count',
      children: formatMessage(
        ritstjornTableMessages.publishing.publishingCount,
      ),
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

        const days = getDaysDelta(advert.scheduledAt)

        const pubCount = advert.publications.length
        const publishedCount = advert.publications.filter(
          (pub) => pub.publishedAt,
        ).length

        let tagText = ''
        let tagVariant: React.ComponentProps<typeof Tag>['variant'] = 'blue'
        if (days === -1) {
          tagText = formatMessage(ritstjornTableMessages.publishing.yesterday)
          tagVariant = 'rose'
        } else if (days < -1) {
          tagText = formatMessage(ritstjornTableMessages.publishing.daysAgo, {
            days: Math.abs(days),
            dative: getIcelandicDative(Math.abs(days)),
          })
          tagVariant = 'red'
        } else if (days === 0) {
          tagText = formatMessage(ritstjornTableMessages.publishing.today)
          tagVariant = 'mint'
        } else if (days === 1) {
          tagText = formatMessage(ritstjornTableMessages.publishing.tomorrow)
          tagVariant = 'blue'
        } else {
          tagText = formatMessage(
            ritstjornTableMessages.publishing.daysFromNow,
            {
              days,
            },
          )
          tagVariant = 'blue'
        }

        return {
          id: (
            <Checkbox
              label=""
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
            formatMessage(
              ritstjornTableMessages.publishing.noPreviousPublishing,
            )
          ),
          scheduledAt: advert.scheduledAt ? (
            <Text variant="medium" whiteSpace="nowrap">
              {formatDate(advert.scheduledAt, 'dd.MM.yyyy')}
            </Text>
          ) : (
            formatMessage(ritstjornTableMessages.publishing.noScheduledDate)
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
          onClick={() => publishNextBulk({ advertIds: selectedAdvertIds })}
          loading={isBulkPublishing}
          icon="arrowForward"
          disabled={!selectedAdvertIds.length}
        >
          {formatMessage(ritstjornTableMessages.publishing.publishCount, {
            count: selectedAdvertIds.length,
            noun: selectedAdvertIds.length === 1 ? 'birtingu' : 'birtingar',
          })}
        </Button>
      </Inline>
    </Stack>
  )
}
