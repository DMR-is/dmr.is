import debounce from 'lodash/debounce'
import { useRouter } from 'next/router'

import { Box, Input, SkeletonLoader } from '@island.is/island-ui/core'

import { useCaseOverview } from '../../hooks/useCaseOverview'
import { useFormatMessage } from '../../hooks/useFormatMessage'
import { useIsMounted } from '../../hooks/useIsMounted'
import * as styles from './CaseFilters.css'
import { messages } from './messages'

export type ActiveFilters = Array<{ key: string; value: string }>

export const CaseFilters = () => {
  const { formatMessage } = useFormatMessage()
  const router = useRouter()
  const isMounted = useIsMounted()

  const initialSearch = router.query.search as string | undefined

  const { isLoading, isValidating } = useCaseOverview()
  const showLoading = isLoading || isValidating

  const onSearchChange = (value: string) => {
    router.push(
      {
        query: { ...router.query, search: value },
      },
      undefined,
      { shallow: true },
    )
  }

  const debouncedSearch = debounce(onSearchChange, 200)

  return (
    <Box>
      <Box className={styles.caseFilters}>
        {isMounted ? (
          <Input
            loading={showLoading}
            size="sm"
            icon={{ name: 'search', type: 'outline' }}
            backgroundColor="blue"
            name="filter"
            defaultValue={initialSearch}
            onChange={(e) => debouncedSearch(e.target.value)}
            placeholder={formatMessage(messages.general.searchPlaceholder)}
          />
        ) : (
          <SkeletonLoader height={44} />
        )}
      </Box>
    </Box>
  )
}
