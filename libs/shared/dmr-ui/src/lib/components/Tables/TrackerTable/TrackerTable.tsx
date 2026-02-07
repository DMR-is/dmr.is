'use client'
import { Table as T } from '../../../island-is/lib/Table'

export type TrackerTableItem = {
  text: string
}

export type TrackerTableProps = {
  rows: TrackerTableItem[]
}

export const TrackerTable = ({ rows }: TrackerTableProps) => {
  return (
    <T.Table>
      <T.Body>
        {rows.map((row, index) => (
          <T.Row key={index}>
            <T.Data
              key={index}
              box={{
                paddingTop: 'p1',
                paddingBottom: 'p1',
                paddingLeft: 'p1',
                paddingRight: 'p1',
              }}
            >
              <Text>{row.text}</Text>
            </T.Data>
          </T.Row>
        ))}
      </T.Body>
    </T.Table>
  )
}
