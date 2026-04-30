'use client'

import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { Tabs } from '@dmr.is/ui/components/island-is/Tabs'

import {
  COLUMN_EMPLOYEES,
  COLUMN_STATUS,
  MOCK_DATA,
} from '../../../app/(protected)/mal/mocks'
import { TabContent } from './TabContent'

export const TabsContainer = () => {
  return (
    <GridContainer>
      <Tabs
        label="Mál"
        selected="innsendingar"
        contentBackground="blue100"
        tabs={[
          {
            id: 'innsendingar',
            label: `Innsendingar (${MOCK_DATA.length})`,
            content: <TabContent initialData={MOCK_DATA} />,
          },
          {
            id: 'i-vinnslu',
            label: 'Í vinnslu (5)',
            content: (
              <TabContent
                initialData={MOCK_DATA.slice(0, 5)}
                extraColumns={[COLUMN_STATUS, COLUMN_EMPLOYEES]}
              />
            ),
          },
          {
            id: 'afgreitt',
            label: 'Afgreitt (3)',
            content: (
              <TabContent
                initialData={MOCK_DATA.slice(0, 3)}
                extraColumns={[COLUMN_EMPLOYEES]}
              />
            ),
          },
        ]}
      />
    </GridContainer>
  )
}
