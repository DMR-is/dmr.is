import { useFilters } from '@dmr.is/ui/hooks/useFilters'

import { useCases } from '../../hooks/api'
import { CaseTableRitstjorn } from '../tables/CaseTableRitstjorn'

export const CaseOverviewTabs = () => {
  const { params } = useFilters({
    initialPageSize: 50,
  })

  const { data } = useCases({
    params: params,
  })

  return <CaseTableRitstjorn cases={data?.cases} paging={data?.paging} />
}

export default CaseOverviewTabs
