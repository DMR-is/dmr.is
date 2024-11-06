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
import { Category, MainCategory, UpdateMainCategory } from '../../gen/fetch'
import { useCategories, useMainCategories } from '../../hooks/api'
import { LayoutProps } from '../../layout/Layout'

type NewMainCategory = {
  title: string
  slug: string
  description: string
  categories: Category[]
}

export default function CasePublishingOverview() {
  const [selectedMainCategory, setSelectedMainCategory] =
    useState<MainCategory | null>(null)

  const [categoriesToBeAdded, setCategoriesToBeAdded] = useState<Category[]>([])

  const [newMainCategory, setNewMainCategory] = useState<NewMainCategory>({
    title: '',
    slug: '',
    description: '',
    categories: [],
  })

  const [updateBody, setUpdateBody] = useState<UpdateMainCategory>({
    description: '',
    title: '',
  })

  const {
    mainCategories,
    isLoading,
    isCreating,
    isDeleting,
    isUpdatingMainCategory,
    isDeletingMainCategoryCategory,
    isCreatingMainCategoryCategories,
    createMainCategory,
    deleteMainCategory,
    updateMainCategory,
    deleteMainCategoryCategory,
    createMainCategoryCategories,
  } = useMainCategories({
    onGetMainCategoriesSuccess: (data) => {
      if (!selectedMainCategory) {
        return
      }

      const found = data?.mainCategories.find(
        (category) => category.id === selectedMainCategory.id,
      )

      if (!found) {
        return
      }

      setSelectedMainCategory(found)
    },
    onCreateMainCategorySuccess: () => {
      setNewMainCategory({
        title: '',
        slug: '',
        description: '',
        categories: [],
      })
    },
    onDeleteMainCategorySuccess: () => {
      setSelectedMainCategory(null)
    },
    onCreateMainCategoryCategoriesSuccess: () => {
      setCategoriesToBeAdded([])
    },
    params: {
      pageSize: 100,
    },
  })

  const { data: categoriesData } = useCategories({
    params: {
      pageSize: 1000,
    },
  })

  const mainCategoryOptions = mainCategories?.map((category) => ({
    label: category.title,
    value: category.id,
  }))

  const onNewMainCategoryCategoriesChange = (id: string | undefined) => {
    if (!id) {
      return
    }

    const found = categoriesData?.categories.find(
      (category) => category.id === id,
    )

    const isAlreadyAdded = newMainCategory.categories.find(
      (category) => category.id === id,
    )

    if (isAlreadyAdded && found) {
      const filteredCategories = newMainCategory.categories.filter(
        (cat) => cat.id !== found.id,
      )
      setNewMainCategory({ ...newMainCategory, categories: filteredCategories })
    }

    if (!isAlreadyAdded && found) {
      setNewMainCategory({
        ...newMainCategory,
        categories: [...newMainCategory.categories, found],
      })
    }
  }

  const onRemoveNewMainCategoryCategory = (categoryId: string) => {
    const filteredCategories = newMainCategory.categories.filter(
      (category) => category.id !== categoryId,
    )
    setNewMainCategory({ ...newMainCategory, categories: filteredCategories })
  }

  const onMainCategoryChange = (id: string | undefined) => {
    const mainCategory = mainCategories?.find((category) => category.id === id)

    if (!mainCategory) {
      setSelectedMainCategory(null)
      return
    }

    setUpdateBody({
      description: mainCategory.description,
      title: mainCategory.title,
    })
    setSelectedMainCategory(mainCategory)
  }

  const onDeleteMainCategory = (mainCategoryId: string) => {
    if (!selectedMainCategory) {
      return
    }

    const confirmed = confirm(
      `Ertu viss um að þú viljir eyða flokkinum "${selectedMainCategory.title}"?`,
    )

    if (confirmed) {
      deleteMainCategory(mainCategoryId)
    }
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

  const onCreateMainCategory = () => {
    createMainCategory({
      title: newMainCategory.title,
      description: newMainCategory.description,
      categories: newMainCategory.categories.map((category) => category.id),
    })
  }

  const onDeleteMainCategoryCategory = (
    mainCategoryId: string,
    categoryId: string,
  ) => {
    deleteMainCategoryCategory(mainCategoryId, categoryId)
  }

  const canCreateMainCategory =
    newMainCategory.title.length > 0 && newMainCategory.description.length > 0

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
                    key={selectedMainCategory?.title}
                    isLoading={isLoading}
                    backgroundColor="blue"
                    placeholder="Veldu yfirflokk"
                    label="Veldu yfirflokk"
                    size="sm"
                    defaultValue={
                      selectedMainCategory && {
                        label: selectedMainCategory?.title,
                        value: selectedMainCategory?.id,
                      }
                    }
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
                          defaultValue={selectedMainCategory.title}
                          value={updateBody.title}
                          onChange={(e) =>
                            setUpdateBody({
                              ...updateBody,
                              title: e.target.value,
                            })
                          }
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
                          value={
                            updateBody.title
                              ? slugify(updateBody.title, { lower: true })
                              : ''
                          }
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
                        defaultValue={selectedMainCategory.description}
                        value={updateBody.description}
                        onChange={(e) =>
                          setUpdateBody({
                            ...updateBody,
                            description: e.target.value,
                          })
                        }
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
                        loading={isUpdatingMainCategory}
                        onClick={() =>
                          updateMainCategory({
                            mainCategoryId: selectedMainCategory.id,
                            ...updateBody,
                          })
                        }
                      >
                        Uppfæra flokk
                      </Button>
                      <Button
                        loading={isDeleting}
                        size="small"
                        variant="ghost"
                        colorScheme="destructive"
                        icon="trash"
                        iconType="outline"
                        onClick={() =>
                          onDeleteMainCategory(selectedMainCategory.id)
                        }
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
                    <Stack space={[2, 2, 3]}>
                      <Select
                        backgroundColor="blue"
                        size="sm"
                        placeholder="Veldu flokka"
                        label="Veldu flokka sem á að bæta við"
                        options={categoriesData?.categories.map((category) => ({
                          label: category.title,
                          value: category.id,
                        }))}
                        onChange={(option) =>
                          onNewMainCategoryCategoriesChange(option?.value)
                        }
                      />
                      {newMainCategory.categories.length > 0 && (
                        <Inline space={2}>
                          {newMainCategory.categories.map((category) => (
                            <Tag
                              key={category.id}
                              outlined
                              onClick={() =>
                                onRemoveNewMainCategoryCategory(category.id)
                              }
                            >
                              <Box
                                display="flex"
                                alignItems="center"
                                rowGap={2}
                                columnGap={2}
                              >
                                {category.title}
                                <Icon
                                  size="small"
                                  icon="trash"
                                  type="outline"
                                />
                              </Box>
                            </Tag>
                          ))}
                        </Inline>
                      )}
                    </Stack>
                  </Box>
                  <Box>
                    <Button
                      disabled={!canCreateMainCategory}
                      size="small"
                      variant="ghost"
                      icon="add"
                      loading={isCreating}
                      iconType="outline"
                      onClick={() => onCreateMainCategory()}
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
                        <Box cursor="pointer">
                          <Tag
                            variant="mint"
                            key={category.id}
                            disabled={isDeletingMainCategoryCategory}
                          >
                            <Box
                              display="flex"
                              alignItems="center"
                              rowGap={2}
                              columnGap={2}
                              onClick={() =>
                                onDeleteMainCategoryCategory(
                                  selectedMainCategory.id,
                                  category.id,
                                )
                              }
                            >
                              {category.title}
                              <Icon size="small" icon="trash" type="outline" />
                            </Box>
                          </Tag>
                        </Box>
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
                      isDisabled={
                        selectedMainCategory === null ||
                        isCreatingMainCategoryCategories
                      }
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
                  {categoriesToBeAdded.length > 0 && (
                    <Inline space={2}>
                      {categoriesToBeAdded.map((category) => (
                        <Box cursor="pointer">
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
                        </Box>
                      ))}
                    </Inline>
                  )}
                  <Button
                    disabled={
                      categoriesToBeAdded.length === 0 ||
                      selectedMainCategory === null
                    }
                    size="small"
                    variant="ghost"
                    icon="add"
                    iconType="outline"
                    onClick={() => {
                      if (!selectedMainCategory) return
                      createMainCategoryCategories(
                        selectedMainCategory.id,
                        categoriesToBeAdded.map((category) => category.id),
                      )
                    }}
                  >
                    Bæta við flokkum
                  </Button>
                </Stack>
              </ContentWrapper>
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
