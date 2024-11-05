import { useState } from 'react'
import slugify from 'slugify'

import {
  AlertMessage,
  Box,
  Button,
  GridColumn,
  GridContainer,
  GridRow,
  Icon,
  Inline,
  Input,
  Select,
  Stack,
  Tag,
  Text,
} from '@island.is/island-ui/core'

import { Section } from '../../components/section/Section'
import { MainCategory } from '../../gen/fetch'
import { useCategories, useMainCategories } from '../../hooks/api'
import { LayoutProps } from '../../layout/Layout'

export default function CasePublishingOverview() {
  const [selectedMainCategory, setSelectedMainCategory] =
    useState<MainCategory | null>(null)

  const [newMainCategory, setNewMainCategory] = useState({
    title: '',
    slug: '',
    description: '',
  })

  const { data: mainCategoriesData } = useMainCategories({
    params: {
      pageSize: 100,
    },
  })

  const { data: categoriesData } = useCategories({
    params: {
      pageSize: 1000,
    },
  })

  const mainCategoryOptions = mainCategoriesData?.mainCategories.map(
    (category) => ({
      label: category.title,
      value: category.id,
    }),
  )

  const onMainCategoryChange = (id: string | undefined) => {
    const mainCategory = mainCategoriesData?.mainCategories.find(
      (category) => category.id === id,
    )

    setSelectedMainCategory(mainCategory || null)
  }

  return (
    <Section>
      <GridContainer>
        <GridRow rowGap={2}>
          <GridColumn span={['12/12', '6/12']} paddingBottom={2}>
            <Stack space={2}>
              <Text variant="h2">Yfirflokkar</Text>
              <Box display="flex" justifyContent="flexStart">
                <Select
                  placeholder="Veldu yfirflokk"
                  size="sm"
                  options={mainCategoryOptions}
                  onChange={(option) => onMainCategoryChange(option?.value)}
                />
              </Box>
            </Stack>
          </GridColumn>
          <GridColumn span={['12/12', '6/12']} paddingBottom={2}>
            <Stack space={2}>
              <Text variant="h2">Undirflokkar</Text>
              {selectedMainCategory === null && (
                <AlertMessage
                  type="info"
                  title="Enginn yfirflokkur valinn"
                  message="Veldu yfirflokk til að sjá undirflokka"
                />
              )}

              {selectedMainCategory &&
                selectedMainCategory.categories.length === 0 && (
                  <AlertMessage
                    type="info"
                    title="Engir undirflokkar"
                    message="Engir undirflokkar fyrir valinn yfirflokk"
                  />
                )}
              <Inline space={2}>
                {selectedMainCategory &&
                  selectedMainCategory.categories.map((category) => (
                    <Tag key={category.id}>
                      <Box
                        display="flex"
                        alignItems="center"
                        rowGap={2}
                        columnGap={2}
                      >
                        <Text variant="eyebrow">{category.title}</Text>
                        <Icon size="small" icon="trash" type="outline" />
                      </Box>
                    </Tag>
                  ))}
              </Inline>
            </Stack>
          </GridColumn>
        </GridRow>
        <GridRow direction={['columnReverse', 'row']} rowGap={2}>
          <GridColumn span={['12/12', '6/12']}>
            <Stack space={2}>
              <Text variant="h3">Búa til nýjan yfirflokk</Text>
              <Box display="flex" rowGap={2} columnGap={2} flexWrap="wrap">
                <Box flexGrow={1}>
                  <Input
                    size="sm"
                    name="maincategory-name"
                    placeholder="Heiti yfirflokks"
                    onChange={(e) =>
                      setNewMainCategory({
                        ...newMainCategory,
                        title: e.target.value,
                        slug: slugify(e.target.value, { lower: true }),
                      })
                    }
                    value={newMainCategory.title}
                  />
                </Box>
                <Box flexGrow={1}>
                  <Input
                    size="sm"
                    readOnly
                    name="maincategory-name"
                    placeholder="Slóð"
                    value={newMainCategory.slug}
                  />
                </Box>
              </Box>
              <Box>
                <Input
                  name="maincategory-description"
                  size="sm"
                  placeholder="Lýsing á yfirflokk"
                  rows={3}
                  textarea
                  onChange={(e) =>
                    setNewMainCategory({
                      ...newMainCategory,
                      description: e.target.value,
                    })
                  }
                />
              </Box>
              <Box>
                <Button
                  size="small"
                  variant="utility"
                  icon="add"
                  iconType="outline"
                >
                  Búa til yfirflokk
                </Button>
              </Box>
            </Stack>
          </GridColumn>
          <GridColumn span={['12/12', '6/12']}>
            <Stack space={2}>
              <Text variant="h3">Bæta flokk við yfirflokk</Text>
              <Box display="flex" justifyContent="flexStart">
                <Select
                  isDisabled={selectedMainCategory === null}
                  size="sm"
                  placeholder="Bæta við flokk"
                  options={categoriesData?.categories.map((category) => ({
                    label: category.title,
                    value: category.id,
                  }))}
                />
              </Box>
            </Stack>
          </GridColumn>
        </GridRow>
      </GridContainer>
    </Section>
  )
}
export const getServerSideProps = async () => {
  const layout: LayoutProps = {
    bannerProps: {
      showBanner: false,
    },
  }

  return {
    props: {
      layout,
    },
  }
}
