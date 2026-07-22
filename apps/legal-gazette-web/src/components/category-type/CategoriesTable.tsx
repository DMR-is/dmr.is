import { Box } from '@dmr.is/ui/components/island-is/Box'
import { Button } from '@dmr.is/ui/components/island-is/Button'
import { Inline } from '@dmr.is/ui/components/island-is/Inline'
import { Select } from '@dmr.is/ui/components/island-is/Select'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Tag } from '@dmr.is/ui/components/island-is/Tag'
import { Text } from '@dmr.is/ui/components/island-is/Text'
import { Table } from '@dmr.is/ui/components/Tables/Table'

import { CategoryOverviewDto, TypeOverviewDto } from '../../gen/fetch'

import { type ColumnDef } from '@tanstack/react-table'

type Props = {
  categories?: CategoryOverviewDto[]
  allTypes: TypeOverviewDto[]
  busyId?: string
  loading?: boolean
  onRename: (category: CategoryOverviewDto) => void
  onToggleActive: (category: CategoryOverviewDto) => void
  onDelete: (category: CategoryOverviewDto) => void
  onAttach: (typeId: string, categoryId: string) => void
  onDetach: (typeId: string, categoryId: string) => void
}

const typeCountLabel = (n: number) => `${n} ${n === 1 ? 'tegund' : 'tegundir'}`

export const CategoriesTable = ({
  categories,
  allTypes,
  busyId,
  loading,
  onRename,
  onToggleActive,
  onDelete,
  onAttach,
  onDetach,
}: Props) => {
  const columns: ColumnDef<CategoryOverviewDto>[] = [
    {
      accessorKey: 'title',
      header: 'Flokkur',
      cell: ({ row }) => <Text variant="medium">{row.original.title}</Text>,
    },
    {
      id: 'connections',
      header: 'Tegundir',
      size: 160,
      cell: ({ row }) => (
        <Text variant="small" color="dark400">
          {typeCountLabel(row.original.types.length)}
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

  const renderExpanded = (category: CategoryOverviewDto) => (
    <Box paddingX={[2, 3]} paddingY={2}>
      <Stack space={3}>
        <Stack space={1}>
          <Text variant="eyebrow" color="dark400">
            Tegundir (smelltu til að aftengja)
          </Text>
          {category.types.length ? (
            <Inline space={1} flexWrap="wrap">
              {category.types.map((type) => (
                <Tag
                  key={type.id}
                  outlined
                  variant={type.active ? 'blue' : 'red'}
                  onClick={() => onDetach(type.id, category.id)}
                >
                  {type.title} ✕
                </Tag>
              ))}
            </Inline>
          ) : (
            <Text variant="small" color="dark300">
              Engar tegundir tengdar
            </Text>
          )}
          <Box style={{ maxWidth: 320 }}>
            <Select
              size="sm"
              backgroundColor="blue"
              placeholder="Tengja tegund..."
              value={null}
              options={allTypes
                .filter(
                  (t) => !category.types.some((ct) => ct.id === t.id),
                )
                .map((t) => ({ label: t.title, value: t.id }))}
              onChange={(opt) => {
                if (opt?.value) onAttach(opt.value, category.id)
              }}
            />
          </Box>
        </Stack>
        <Inline space={2} flexWrap="wrap">
          <Button
            size="small"
            variant="utility"
            icon="pencil"
            iconType="outline"
            onClick={() => onRename(category)}
          >
            Endurnefna
          </Button>
          <Button
            size="small"
            variant="utility"
            icon={category.active ? 'eye' : 'eyeOff'}
            iconType="outline"
            loading={busyId === category.id}
            onClick={() => onToggleActive(category)}
          >
            {category.active ? 'Óvirkja' : 'Virkja'}
          </Button>
          <Button
            size="small"
            variant="utility"
            colorScheme="destructive"
            icon="trash"
            iconType="outline"
            onClick={() => onDelete(category)}
          >
            Eyða
          </Button>
        </Inline>
      </Stack>
    </Box>
  )

  return (
    <Table
      columns={columns}
      data={categories ?? []}
      loading={loading}
      getRowExpanded={renderExpanded}
      noDataMessage="Engir flokkar fundust"
    />
  )
}
