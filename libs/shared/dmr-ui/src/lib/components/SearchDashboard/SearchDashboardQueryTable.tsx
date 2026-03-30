import { Box } from '../../island-is/lib/Box'
import { Stack } from '../../island-is/lib/Stack'
import { Table as T } from '../../island-is/lib/Table'
import { Text } from '../../island-is/lib/Text'
import { Tooltip } from '../../island-is/lib/Tooltip'
import * as styles from './SearchDashboard.css'
import { SearchDashboardPanel } from './SearchDashboardPanel'
import type {
  SearchDashboardQueryTableColumn,
  SearchDashboardQueryTableProps,
} from './types'

const DEFAULT_COLUMNS: SearchDashboardQueryTableColumn[] = [
  { key: 'normalizedQuery', label: 'Leit', align: 'left' as const },
  { key: 'count', label: 'Fjöldi', align: 'right' as const },
  { key: 'zeroResultRate', label: '0 niðurstöður', align: 'right' as const },
  { key: 'avgDurationMs', label: 'Meðaltími', align: 'right' as const },
  { key: 'resultBucket', label: 'Niðurstöður', align: 'right' as const },
]

export const SearchDashboardQueryTable = ({
  title,
  description,
  helpText,
  emptyMessage = 'Engar leitir fundust á völdu tímabili',
  columns = DEFAULT_COLUMNS,
  rows,
}: SearchDashboardQueryTableProps) => {
  return (
    <SearchDashboardPanel
      title={title}
      description={description}
      helpText={helpText}
    >
      {rows.length === 0 ? (
        <Text variant="small">{emptyMessage}</Text>
      ) : (
        <T.Table>
            <T.Head>
              <T.Row>
                {columns.map((column) => (
                  <T.HeadData key={column.key} align={column.align ?? 'left'}>
                    <Box className={styles.tableHeadContent}>
                      <Text variant="small" fontWeight="semiBold">
                        {column.label}
                      </Text>
                      {column.helpText ? (
                        <Tooltip
                          text={column.helpText}
                          placement="bottom"
                          horizontalAlign={
                            column.align === 'left'
                              ? 'start'
                              : column.align === 'right'
                                ? 'end'
                                : 'center'
                          }
                          color="blue400"
                        />
                      ) : null}
                    </Box>
                  </T.HeadData>
                ))}
              </T.Row>
            </T.Head>
            <T.Body>
              {rows.map((row) => (
                <T.Row key={`${row.normalizedQuery}-${row.resultBucket}`}>
                  <T.Data align="left">
                    <Text className={styles.queryCell} variant="small">
                      {row.normalizedQuery}
                    </Text>
                  </T.Data>
                  <T.Data align="right">{row.count}</T.Data>
                  <T.Data align="right">{row.zeroResultRate}</T.Data>
                  <T.Data align="right">{row.avgDurationMs}</T.Data>
                  <T.Data align="right">{row.resultBucket}</T.Data>
                </T.Row>
                ))}
            </T.Body>
        </T.Table>
      )}
    </SearchDashboardPanel>
  )
}
