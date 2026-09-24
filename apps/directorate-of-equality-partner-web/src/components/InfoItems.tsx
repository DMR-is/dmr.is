import { isValidElement } from 'react'

import { Box } from '@dmr.is/ui/components/island-is/Box'
import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { sharedText } from '../lib/text'

export type InfoItem = {
  label: string
  children: React.ReactNode
  /** Grows the item to the full row, for a value that needs the width. */
  wide?: boolean
}

/**
 * A label/value grid, after directorate-of-equality-web's `InfoItems`. Built on
 * the grid rather than a fixed two-column CSS grid so it folds to one column on
 * a phone, where representatives often sign in with rafræn skilríki.
 *
 * An empty value reads "Óþekkt" rather than rendering a label over nothing.
 */
export const InfoItems = ({ items }: { items: InfoItem[] }) => (
  <GridRow rowGap={3}>
    {items.map((item) => (
      <GridColumn
        key={item.label}
        span={item.wide ? '12/12' : ['12/12', '6/12', '6/12', '4/12']}
      >
        <Box>
          <Text variant="small" fontWeight="semiBold" color="dark400">
            {item.label}
          </Text>
          {isValidElement(item.children) ? (
            item.children
          ) : (
            <Text>
              {item.children === undefined ||
              item.children === null ||
              item.children === ''
                ? sharedText.unknown
                : item.children}
            </Text>
          )}
        </Box>
      </GridColumn>
    ))}
  </GridRow>
)
