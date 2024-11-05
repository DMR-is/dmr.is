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
} from '@island.is/island-ui/core'

import { ContentWrapper } from '../../components/content-wrapper/ContentWrapper'
import { Section } from '../../components/section/Section'
import { Category, MainCategory } from '../../gen/fetch'
import { useCategories, useMainCategories } from '../../hooks/api'
import { LayoutProps } from '../../layout/Layout'

export default function CasePublishingOverview() {
  const [selectedMainCategory, setSelectedMainCategory] =
    useState<MainCategory | null>(null)

  const [categoriesToBeAdded, setCategoriesToBeAdded] = useState<Category[]>([])

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

  const onCategoryChange = (id: string | undefined) => {
    if (!id) {
      return
    }

    const found = categoriesData?.categories.find(
      (category) => category.id === id,
    )

    const isAlreadyAdded = categoriesToBeAdded.find(
      (category) => category.id === id,
    )

    if (isAlreadyAdded && found) {
      const filteredCategories = categoriesToBeAdded.filter(
        (cat) => cat.id !== found.id,
      )
      setCategoriesToBeAdded([...filteredCategories])
    }

    if (!isAlreadyAdded && found) {
      setCategoriesToBeAdded([...categoriesToBeAdded, found])
    }
  }

  const onCategoryRemove = (id: string) => {
    const filteredCategories = categoriesToBeAdded.filter(
      (category) => category.id !== id,
    )

    setCategoriesToBeAdded([...filteredCategories])
  }

  return (
    <Section>
      <GridContainer>
        <GridRow rowGap={[2, 2, 3]}>
          <GridColumn
            span={['12/12', '12/12', '6/12']}
            paddingBottom={[0, 2, 3]}
          >
            <Stack space={[2, 2, 3]}>
              <ContentWrapper title="Yfirflokkar" background="white">
                <Box display="flex" justifyContent="flexStart">
                  <Select
                    backgroundColor="blue"
                    placeholder="Veldu yfirflokk"
                    label="Veldu yfirflokk"
                    size="sm"
                    options={mainCategoryOptions}
                    onChange={(option) => onMainCategoryChange(option?.value)}
                  />
                </Box>
              </ContentWrapper>
              {selectedMainCategory !== null && (
                <ContentWrapper
                  title={`Breyta yfirflokki ${selectedMainCategory?.title}`}
                  background="white"
                >
                  <Stack space={[2, 2, 3]}>
                    <Box
                      display="flex"
                      rowGap={2}
                      columnGap={2}
                      flexWrap="wrap"
                    >
                      <Box flexGrow={1}>
                        <Input
                          backgroundColor="blue"
                          size="sm"
                          name="current-category-name"
                          placeholder="Heiti yfirflokks"
                          label="Heiti yfirflokks"
                          value={selectedMainCategory.title}
                        />
                      </Box>
                      <Box flexGrow={1}>
                        <Input
                          backgroundColor="blue"
                          size="sm"
                          readOnly
                          name="current-category-name"
                          placeholder="Slóð"
                          label="Slóð"
                          value={selectedMainCategory.slug}
                        />
                      </Box>
                    </Box>
                    <Box>
                      <Input
                        backgroundColor="blue"
                        textarea
                        name="current-category-description"
                        size="sm"
                        placeholder="Lýsing á yfirflokk"
                        label="Lýsing á yfirflokk"
                        rows={3}
                        value={selectedMainCategory.description}
                      />
                    </Box>
                    <Box
                      display="flex"
                      justifyContent="spaceBetween"
                      alignItems="center"
                      flexWrap="wrap"
                      rowGap={2}
                      columnGap={2}
                    >
                      <Button
                        size="small"
                        variant="ghost"
                        icon="pencil"
                        iconType="outline"
                      >
                        Uppfæra flokk
                      </Button>
                      <Button
                        size="small"
                        variant="ghost"
                        colorScheme="destructive"
                        icon="trash"
                        iconType="outline"
                      >
                        Eyða flokk
                      </Button>
                    </Box>
                  </Stack>
                </ContentWrapper>
              )}
              <ContentWrapper
                title="Búa til nýjan yfirflokk"
                background="white"
              >
                <Stack space={[2, 2, 3]}>
                  <Box display="flex" rowGap={2} columnGap={2} flexWrap="wrap">
                    <Box flexGrow={1}>
                      <Input
                        backgroundColor="blue"
                        size="sm"
                        name="maincategory-name"
                        placeholder="Heiti yfirflokks"
                        label="Heiti yfirflokks"
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
                        backgroundColor="blue"
                        size="sm"
                        readOnly
                        name="maincategory-name"
                        placeholder="Slóð"
                        label="Slóð"
                        value={newMainCategory.slug}
                      />
                    </Box>
                  </Box>
                  <Box>
                    <Input
                      backgroundColor="blue"
                      name="maincategory-description"
                      size="sm"
                      placeholder="Lýsing á yfirflokk"
                      label="Lýsing á yfirflokk"
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
                      variant="ghost"
                      icon="add"
                      iconType="outline"
                    >
                      Búa til yfirflokk
                    </Button>
                  </Box>
                </Stack>
              </ContentWrapper>
            </Stack>
          </GridColumn>
          <GridColumn
            span={['12/12', '12/12', '6/12']}
            paddingBottom={[2, 2, 3]}
          >
            <Stack space={[2, 2, 3]}>
              <ContentWrapper
                title={`Undirflokkar${
                  selectedMainCategory ? ` ${selectedMainCategory.title}` : ''
                }`}
                background="white"
              >
                <Stack space={[2, 2, 3]}>
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
                        <Tag variant="mint" key={category.id}>
                          <Box
                            display="flex"
                            alignItems="center"
                            rowGap={2}
                            columnGap={2}
                          >
                            {category.title}
                            <Icon size="small" icon="trash" type="outline" />
                          </Box>
                        </Tag>
                      ))}
                  </Inline>
                </Stack>
              </ContentWrapper>
              <ContentWrapper
                title="Bæta flokk við yfirflokk"
                background="white"
              >
                <Stack space={[2, 2, 3]}>
                  <Box display="flex" justifyContent="flexStart">
                    <Select
                      backgroundColor="blue"
                      isDisabled={selectedMainCategory === null}
                      size="sm"
                      placeholder="Veldu flokka"
                      label="Veldu þá flokka sem á að bæta við"
                      options={categoriesData?.categories.map((category) => ({
                        label: category.title,
                        value: category.id,
                      }))}
                      onChange={(option) => onCategoryChange(option?.value)}
                    />
                  </Box>
                  <Inline space={2}>
                    {categoriesToBeAdded.map((category) => (
                      <Tag
                        key={category.id}
                        outlined
                        onClick={() => onCategoryRemove(category.id)}
                      >
                        <Box
                          display="flex"
                          alignItems="center"
                          rowGap={2}
                          columnGap={2}
                        >
                          {category.title}
                          <Icon size="small" icon="trash" type="outline" />
                        </Box>
                      </Tag>
                    ))}
                  </Inline>
                  <Button
                    size="small"
                    variant="ghost"
                    icon="add"
                    iconType="outline"
                  >
                    Bæta við flokkum
                  </Button>
                </Stack>
              </ContentWrapper>
            </Stack>
          </GridColumn>
        </GridRow>
        <GridRow rowGap={[2, 2, 3]}>
          <GridColumn span={['12/12', '12/12', '6/12']}></GridColumn>
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
