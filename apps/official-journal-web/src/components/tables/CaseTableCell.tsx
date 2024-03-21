import { Table as T } from '@island.is/island-ui/core'

export const TableCell = ({ children }: { children: React.ReactNode }) => {
  return (
    <T.Data
      box={{
        paddingLeft: [2, 3],
        paddingRight: [1, 2],
        paddingTop: [1, 2],
        paddingBottom: [1, 2],
      }}
    >
      {children}
    </T.Data>
  )
}
