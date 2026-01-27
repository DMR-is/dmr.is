'use client'

import {
  Box,
  Button,
  LinkV2,
  SkeletonLoader,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'
import { DataTable } from '@dmr.is/ui/components/Tables/DataTable'
import { formatDate } from '@dmr.is/utils/client'

import { useFilters } from '../../../../hooks/useFilters'
import { useIssues } from '../../../../hooks/useIssues'

export const SearchIssuesResults = () => {
  const { setFilters } = useFilters()
  const { data, isLoading } = useIssues()

  return (
    <Stack space={[2, 3, 4]}>
      {isLoading ? (
        <SkeletonLoader
          height={230}
          borderRadius="large"
          repeat={5}
          space={[2, 3, 4]}
        />
      ) : (data?.issues?.length || 0) > 0 ? (
        <Box paddingBottom={3} borderRadius="large">
          <DataTable
            paging={data?.paging}
            onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
            onPageSizeChange={(pageSize) =>
              setFilters((prev) => ({ ...prev, pageSize, page: 1 }))
            }
            showPageSizeSelect={false}
            tableBackground="white"
            columns={[
              {
                field: 'nr',
                children: 'Tbl.nr.',
              },
              {
                field: 'date',
                children: 'Útg.dagur',
                name: 'date',
              },
              {
                field: 'link',
                children: 'Útgáfusnið',
                width: '18%',
              },
            ]}
            rows={
              data?.issues?.map((issue) => ({
                nr: issue.issue,
                date: formatDate(issue.publishDate),
                link: (
                  <LinkV2 href={issue.url ?? '#'} newTab>
                    <Button
                      variant="text"
                      size="small"
                      icon="document"
                      iconType="outline"
                    >
                      Sækja pdf
                    </Button>
                  </LinkV2>
                ),
              })) || []
            }
          />
        </Box>
      ) : (
        <Box padding={[2, 3, 4]} borderRadius="md" background={'white'}>
          <Text variant="h3">Engin tölublöð fundust</Text>
          <Text>Vinsamlegast endurskoðaðu síunar</Text>
        </Box>
      )}
    </Stack>
  )
}
