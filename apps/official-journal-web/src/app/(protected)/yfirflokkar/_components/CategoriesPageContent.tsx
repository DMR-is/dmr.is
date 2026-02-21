'use client'

import { GridColumn } from '@dmr.is/ui/components/island-is/GridColumn'
import { GridContainer } from '@dmr.is/ui/components/island-is/GridContainer'
import { GridRow } from '@dmr.is/ui/components/island-is/GridRow'
import { Stack } from '@dmr.is/ui/components/island-is/Stack'
import { Text } from '@dmr.is/ui/components/island-is/Text'

import { Categories } from '../../../../components/categories/Categories'
import { CreateCategory } from '../../../../components/categories/CreateCategory'
import { CreateMainCategory } from '../../../../components/categories/CreateMainCategory'
import { MainCategories } from '../../../../components/categories/MainCategories'
import { MergeCategories } from '../../../../components/categories/MergeCategories'
import { UpdateCategory } from '../../../../components/categories/UpdateCategory'
import { UpdateMainCategory } from '../../../../components/categories/UpdateMainCategory'
import { Section } from '../../../../components/section/Section'

export function CategoriesPageContent() {
  return (
    <Section>
      <GridContainer>
        <Stack space={4}>
          <GridRow>
            <GridColumn span="12/12">
              <Text variant="h2">Yfirflokkar málaflokka</Text>
            </GridColumn>
          </GridRow>
          <GridRow>
            <GridColumn span={['12/12', '6/12']}>
              <Stack space={4}>
                <MainCategories />
                <CreateMainCategory />
              </Stack>
            </GridColumn>
            <GridColumn span={['12/12', '6/12']}>
              <UpdateMainCategory />
            </GridColumn>
          </GridRow>
          <GridRow>
            <GridColumn span="12/12">
              <Text variant="h2">Málaflokkar</Text>
            </GridColumn>
          </GridRow>
          <GridRow>
            <GridColumn span={['12/12', '6/12']}>
              <Stack space={4}>
                <Categories />
                <CreateCategory />
              </Stack>
            </GridColumn>
            <GridColumn span={['12/12', '6/12']}>
              <Stack space={4}>
                <UpdateCategory />
                <MergeCategories />
              </Stack>
            </GridColumn>
          </GridRow>
        </Stack>
      </GridContainer>
    </Section>
  )
}
