'use client'

import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { Tabs } from '@dmr.is/ui/components/island-is/Tabs'

import { MOCK_DATA } from '../../../app/(protected)/mal/mocks'
import { COLUMN_EMPLOYEES, COLUMN_STATUS } from '../constants'
import { TabContent } from './TabContent'

const iVinnsluData = MOCK_DATA.slice(0, 5)
const afgreittData = MOCK_DATA.slice(0, 3)

export const TabsContainer = () => {
  return (
    <GridContainer>
      <Tabs
        label="Mál"
        selected="innsendingar"
        contentBackground="blue100"
        size="sm"
        tabs={[
          {
            id: 'innsendingar',
            label: `Innsendingar (${MOCK_DATA.length})`,
            content: <TabContent initialData={MOCK_DATA} />,
          },
          {
            id: 'i-vinnslu',
            label: `Í vinnslu (${iVinnsluData.length})`,
            content: (
              <TabContent
                initialData={iVinnsluData}
                extraColumns={[COLUMN_STATUS, COLUMN_EMPLOYEES]}
              />
            ),
          },
          {
            id: 'afgreitt',
            label: `Afgreitt (${afgreittData.length})`,
            content: (
              <TabContent
                initialData={afgreittData}
                extraColumns={[COLUMN_EMPLOYEES]}
              />
            ),
          },
        ]}
      />
    </GridContainer>
  )
}
