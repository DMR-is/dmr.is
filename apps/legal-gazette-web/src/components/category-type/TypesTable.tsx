import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Tag } from '@dmr.is/ui/components/island-is/Tag'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { Table } from '@dmr.is/ui/components/Tables/Table'

import { TypeOverviewDto } from '../../gen/fetch'

import { type ColumnDef } from '@tanstack/react-table'

export type ConnectedCategory = { id: string; title: string }

type Props = {
  types?: TypeOverviewDto[]
  categoriesByTypeId: Record<string, ConnectedCategory[]>
  busyId?: string
  loading?: boolean
  onRename: (type: TypeOverviewDto) => void
  onToggleActive: (type: TypeOverviewDto) => void
  onMove: (type: TypeOverviewDto) => void
  onDelete: (type: TypeOverviewDto) => void
  onDetach: (typeId: string, categoryId: string) => void
}

const categoryCountLabel = (n: number) =>
  `${n} ${n === 1 ? 'flokkur' : 'flokkar'}`

export const TypesTable = ({
  types,
  categoriesByTypeId,
  busyId,
  loading,
  onRename,
  onToggleActive,
  onMove,
  onDelete,
  onDetach,
}: Props) => {
  const columns: ColumnDef<TypeOverviewDto>[] = [
    {
      accessorKey: 'title',
      header: 'Tegund',
      cell: ({ row }) => <Text variant="medium">{row.original.title}</Text>,
    },
    {
      id: 'connections',
      header: 'Flokkar',
      size: 160,
      cell: ({ row }) => (
        <Text variant="small" color="dark400">
          {categoryCountLabel((categoriesByTypeId[row.original.id] ?? []).length)}
        </Text>
      ),
    },
    {
      id: 'status',
      header: 'Staða',
      size: 120,
      cell: ({ row }) => (
        <Tag disabled variant={row.original.active ? 'mint' : 'red'}>
          {row.original.active ? 'Virkur' : 'Óvirkur'}
        </Tag>
      ),
    },
  ]

  const renderExpanded = (type: TypeOverviewDto) => {
    const connected = categoriesByTypeId[type.id] ?? []
    return (
      <Box paddingX={[2, 3]} paddingY={2}>
        <Stack space={3}>
          <Stack space={1}>
            <Text variant="eyebrow" color="dark400">
              Flokkar (smelltu til að aftengja)
            </Text>
            {connected.length ? (
              <Inline space={1} flexWrap="wrap">
                {connected.map((category) => (
                  <Tag
                    key={category.id}
                    outlined
                    variant="purple"
                    onClick={() => onDetach(type.id, category.id)}
                  >
                    {category.title} ✕
                  </Tag>
                ))}
              </Inline>
            ) : (
              <Text variant="small" color="dark300">
                Engir flokkar tengdir
              </Text>
            )}
          </Stack>
          <Inline space={2} flexWrap="wrap">
            <Button
              size="small"
              variant="utility"
              icon="pencil"
              iconType="outline"
              onClick={() => onRename(type)}
            >
              Endurnefna
            </Button>
            <Button
              size="small"
              variant="utility"
              icon={type.active ? 'eye' : 'eyeOff'}
              iconType="outline"
              loading={busyId === type.id}
              onClick={() => onToggleActive(type)}
            >
              {type.active ? 'Óvirkja' : 'Virkja'}
            </Button>
            <Button size="small" variant="utility" onClick={() => onMove(type)}>
              Færa
            </Button>
            <Button
              size="small"
              variant="utility"
              colorScheme="destructive"
              icon="trash"
              iconType="outline"
              onClick={() => onDelete(type)}
            >
              Eyða
            </Button>
          </Inline>
        </Stack>
      </Box>
    )
  }

  return (
    <Table
      columns={columns}
      data={types ?? []}
      loading={loading}
      getRowExpanded={renderExpanded}
      noDataMessage="Engar tegundir fundust"
    />
  )
}
