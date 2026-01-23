'use client'

import {
  AlertMessage,
  Pagination,
  SkeletonLoader,
} from '@dmr.is/ui/components/island-is'
import { Stack, Text } from '@dmr.is/ui/components/island-is'

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
    <Stack space={[2, 3, 4]}>
      <Text variant="h2">Mínar auglýsingar</Text>

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
        <Text>Engar auglýsingar fundust, kannski þarf að breyta síu</Text>
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
