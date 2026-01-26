'use client'

import {
  AlertMessage,
  Box,
  Button,
  LinkV2,
  Pagination,
  SkeletonLoader,
} from '@dmr.is/ui/components/island-is'
import { Stack, Text } from '@dmr.is/ui/components/island-is'

import { Inline } from '@island.is/island-ui/core'

import { ApplicationDto, Paging } from '../../gen/fetch'
import { ApplicationCard } from './ApplicationCard'

type Props = {
  isLoading?: boolean
  applications?: ApplicationDto[]
  paging?: Paging
  error?: string
  onPageChange?: (page: number) => void
}

export const ApplicationList = ({
  applications,
  paging,
  isLoading,
  error,
  onPageChange,
}: Props) => {
  if (isLoading) {
    return (
      <SkeletonLoader
        repeat={5}
        height={152}
        borderRadius="large"
        space={[2, 3]}
      />
    )
  }

  return (
    <Stack space={[1, 2, 3]}>
      <Inline justifyContent="spaceBetween" alignY="center">
        {/* <Text variant="h3">Mínar auglýsingar</Text> */}
        <Box>
          {paging?.totalItems ? (
            <Text>
              <strong>
                {paging?.page > 1
                  ? paging?.pageSize * (paging?.page - 1) + 1
                  : 1}
              </strong>
              {' – '}
              <strong>
                {paging?.page * paging?.pageSize < paging?.totalItems
                  ? paging?.page * paging?.pageSize
                  : paging?.totalItems}
              </strong>
              {' af '}
              <strong>{paging?.totalItems}</strong> niðurstöðum
            </Text>
          ) : null}
        </Box>
        <LinkV2 href="/auglysingar/eldri">
          <Button size="small" variant="utility" colorScheme="white">
            Eldri auglýsingar
          </Button>
        </LinkV2>
      </Inline>

      {error && (
        <AlertMessage
          type="error"
          title="Ekki tókst að sækja auglýsingar"
          message={error}
        />
      )}

      {applications && applications.length > 0 ? (
        applications?.map((application, i) => (
          <ApplicationCard application={application} key={i} />
        ))
      ) : (
        <Box background={'white'} borderRadius="large" padding={[4, 5]}>
          <Stack space={1}>
            <Text variant="h3">Engar auglýsingar fundust</Text>
            <Text>Athugaðu hvort breyta þurfi síu</Text>
          </Stack>
        </Box>
      )}

      {paging && paging.totalPages > 1 && (
        <Pagination
          page={paging.page}
          itemsPerPage={paging.pageSize}
          totalItems={paging.totalItems}
          totalPages={paging.totalPages}
          renderLink={(page, className, children) => (
            <button className={className} onClick={() => onPageChange?.(page)}>
              {children}
            </button>
          )}
        />
      )}
    </Stack>
  )
}
