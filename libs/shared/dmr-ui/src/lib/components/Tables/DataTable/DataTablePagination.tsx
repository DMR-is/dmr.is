import { PAGE_SIZE_OPTIONS } from '@dmr.is/constants'

import { Pagination, Select } from '@island.is/island-ui/core'

import { useFilters } from '../../../hooks/useFilters'
import * as styles from './DataTablePagination.css'
import { DataTablePaginationProps } from './types'

export const DataTablePagination = ({
  paging,
  onPageChange,
  onPageSizeChange,
}: DataTablePaginationProps) => {
  const { setParams } = useFilters()

  const handlePageSizeChange = (pageSize: number | undefined = 10) => {
    if (onPageSizeChange) return onPageSizeChange(pageSize)

    setParams({
      pageSize,
      page: 1,
    })
  }

  const handlePageChange = (page: number | undefined = 1) => {
    if (onPageChange) return onPageChange(page)

    setParams({ page })
  }

  return (
    <div className={styles.dataTablePagination({ size: 'small' })}>
      <Pagination
        page={paging.page}
        itemsPerPage={paging.pageSize}
        totalItems={paging.totalItems}
        totalPages={paging.totalPages}
        renderLink={(page, className, children) => (
          <button className={className} onClick={() => handlePageChange(page)}>
            {children}
          </button>
        )}
      />
      <Select
        size="xs"
        value={{
          label: paging.pageSize.toString(),
          value: paging.pageSize,
        }}
        onChange={(e) => handlePageSizeChange(e?.value)}
        options={PAGE_SIZE_OPTIONS}
      />
    </div>
  )
}
