import { Box } from '@dmr.is/ui/components/island-is/Box'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { SearchIssuesResults } from './results/SearchIssuesResults'
import { SearchIssuesSidebar } from './sidebar/SearchIssuesSidebar'

export const SearchIssuesPage = () => {
  return (
    <GridRow>
      <GridColumn span={['12/12', '12/12', '12/12', '3/12']}>
        <Box>
          <SearchIssuesSidebar />
        </Box>
      </GridColumn>
      <GridColumn span={['12/12', '12/12', '12/12', '9/12']}>
        <SearchIssuesResults />
        <GridColumn span={['12/12', '12/12', '12/12', '11/12']}>
          <Text variant="small" marginTop={1}>
            Afritun eða dreifing þessa efnis er óheimil. Efnið kann að innihalda
            persónuupplýsingar sem njóta verndar samkvæmt lögum nr. 90/2018 og
            reglugerð (ESB) 2016/679 (GDPR). Óheimil meðferð getur varðað við
            lög.
          </Text>
        </GridColumn>
      </GridColumn>
    </GridRow>
  )
}
