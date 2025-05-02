import { PAGE_SIZE_OPTIONS } from '@dmr.is/constants'

import { Pagination, Select } from '@island.is/island-ui/core'

import { useFilters } from '../../../hooks/useFilters'
import * as styles from './DataTablePagination.css'
import { DataTablePaginationProps } from './types'

export const DataTablePagination = ({
  paging,
}: DataTablePaginationProps) => {
  const { setParams } = useFilters()

  return (
    <div className={styles.dataTablePagination({ size: 'small' })}>
      <Pagination
        page={paging.page}
        itemsPerPage={paging.pageSize}
        totalItems={paging.totalItems}
        totalPages={paging.totalPages}
        renderLink={(page, className, children) => (
          <button
            className={className}
            onClick={() => setParams({page})}
          >
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
        onChange={(e) => {
          setParams({
            pageSize: e?.value,
            page: 1,
          })
        }}
        options={PAGE_SIZE_OPTIONS}
      />
    </div>
  )
}
