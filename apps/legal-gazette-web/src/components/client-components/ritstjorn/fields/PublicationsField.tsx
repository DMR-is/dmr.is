'use client'

import {
  Box,
  DatePicker,
  GridColumn,
  GridRow,
  Stack,
  Text,
} from '@dmr.is/ui/components/island-is'

import { Tag } from '@island.is/island-ui/core'

import { useAdvertContext } from '../../../../hooks/useAdvertContext'

export const PublicationsFields = () => {
  const { advert } = useAdvertContext()

  return (
    <Stack space={[1, 2]}>
      <GridRow>
        <GridColumn span="12/12">
          <Text variant="h3">Birtingar</Text>
        </GridColumn>
      </GridRow>
      <Stack space={[1, 2]}>
        <GridRow>
          <GridColumn span={['12/12', '6/12']}>
            <Text variant="h4">Áætlaður útgáfudagur</Text>
          </GridColumn>
          <GridColumn span={['12/12', '6/12']}>
            <Text variant="h4">Útgáfudagur</Text>
          </GridColumn>
        </GridRow>
        {advert.publications.map((pub) => (
          <GridRow>
            <GridColumn span={['12/12', '6/12']} key={pub.id}>
              <DatePicker
                label={`Birting ${pub.version}`}
                placeholderText=""
                selected={new Date(pub.scheduledAt)}
                size="sm"
                locale="is"
              />
            </GridColumn>
            <GridColumn span={['12/12', '6/12']} key={pub.id}>
              {pub.publishedAt ? (
                <DatePicker
                  readOnly
                  label="Útgáfudagur"
                  placeholderText=""
                  selected={pub.publishedAt ? new Date(pub.publishedAt) : null}
                  size="sm"
                  locale="is"
                />
              ) : (
                <Box
                  height="full"
                  flexDirection="column"
                  display="flex"
                  justifyContent="center"
                  alignItems="flexStart"
                >
                  <Tag>Á áætlun</Tag>
                </Box>
              )}
            </GridColumn>
          </GridRow>
        ))}
      </Stack>
    </Stack>
  )
}
