import { Table as T } from '@island.is/island-ui/core'

type Props = {
  children?: React.ReactNode
}

export const TableCell = ({ children }: Props) => {
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
