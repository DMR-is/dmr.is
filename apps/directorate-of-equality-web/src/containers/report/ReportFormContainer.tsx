'use client'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Breadcrumbs } from '@dmr.is/ui/components/island-is/Breadcrumbs'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import type { ReportDetailDto } from '../../gen/fetch'
import { useTRPC } from '../../lib/trpc/client/trpc'

import { useQuery, useSuspenseQuery } from '@tanstack/react-query'

type ReportFormContainerProps = {
  id: string
}

export function ReportFormContainer({ id }: ReportFormContainerProps) {
  const trpc = useTRPC()

  // const { data: report } = useQuery(
  //   trpc.reports.getById.queryOptions({ id: id }),
  // ) as { data: ReportDetailDto }

  // if (!report) return null

  const title = <>
    <Text variant="h2">Vinnslusvæði</Text>
          <Text>Forem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.</Text>

  </>
  return (
    <Box background="white" padding={[4, 6, 8]} borderRadius="large">
      <Stack space={[3, 4]}>
        <Stack space={[2]}>
          <Breadcrumbs
            items={[
              { title: 'Forsíða', href: '/' },
              { title: 'Mál', href: '/mal' },
              { title: 'Flott fyrirtæki', href: `/mal/${id}` },
            ]}
          />
        {title}
        </Stack>
      </Stack>
    </Box>
  )
}
