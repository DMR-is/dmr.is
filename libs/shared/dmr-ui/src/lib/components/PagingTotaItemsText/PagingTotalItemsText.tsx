import { Text } from '../../island-is'

type Props = {
  paging?: {
    page: number
    pageSize: number
  }
  totalItems?: number
}

export const PagingTotalItemsText = ({ paging, totalItems }: Props) => {
  if (!paging || !totalItems) return null
  return (
    <Text>
      <strong>
        {paging?.page > 1 ? paging?.pageSize * (paging?.page - 1) + 1 : 1}
      </strong>
      {' – '}
      <strong>
        {paging?.page * paging?.pageSize < totalItems
          ? paging?.page * paging?.pageSize
          : totalItems}
      </strong>
      {' af '}
      <strong>{totalItems}</strong> niðurstöðum
    </Text>
  )
}
