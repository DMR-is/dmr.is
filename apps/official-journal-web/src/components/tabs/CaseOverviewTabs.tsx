import { useFilters } from '@dmr.is/ui/hooks/useFilters'

import { CaseStatusEnum } from '../../gen/fetch'
import { useCases } from '../../hooks/api'
import { CaseTableRitstjorn } from '../tables/CaseTableRitstjorn'

export const CaseOverviewTabs = () => {
  const { params } = useFilters({
    initialPageSize: 50,
  })

  const statuses = [
    CaseStatusEnum.Innsent,
    CaseStatusEnum.Grunnvinnsla,
    CaseStatusEnum.Yfirlestur,
    CaseStatusEnum.Tilbúið,
  ]

  const paramsWithStatuses = {
    ...params,
    status: params.status.length > 0 ? params.status : statuses,
  }

  const { data } = useCases({
    params: paramsWithStatuses,
  })

  return <CaseTableRitstjorn cases={data?.cases} paging={data?.paging} />
}

export default CaseOverviewTabs
