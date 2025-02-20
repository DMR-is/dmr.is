import { GetServerSideProps } from 'next'
import { getSession } from 'next-auth/react'
import { AuthMiddleware } from '@dmr.is/middleware'

import {
  GridColumn,
  GridContainer,
  GridRow,
  Stack,
} from '@island.is/island-ui/core'

import { CreateMainCategory } from '../../components/categories/CreateMainCategory'
import { MainCategories } from '../../components/categories/MainCategories'
import { Section } from '../../components/section/Section'
import { CategoryProvider } from '../../context/mainCategoryContext'
import { Category, Department, MainCategory } from '../../gen/fetch'
import { LayoutProps } from '../../layout/Layout'
import { createDmrClient } from '../../lib/api/createClient'
import { Routes } from '../../lib/constants'
import { loginRedirect } from '../../lib/utils'

type Props = {
  mainCategories: MainCategory[]
  categories: Category[]
  departments: Department[]
}

export default function CasePublishingOverview({
  mainCategories,
  categories,
  departments,
}: Props) {
  return (
    <CategoryProvider
      initalMainCategories={mainCategories}
      initalCategories={categories}
      initalDepartments={departments}
    >
      <Section>
        <GridContainer>
          <GridRow>
            <GridColumn span={['12/12', '6/12']}>
              <Stack space={4}>
                <MainCategories />
                <CreateMainCategory />
              </Stack>
            </GridColumn>
            <GridColumn span={['12/12', '6/12']}></GridColumn>
          </GridRow>
        </GridContainer>
      </Section>
    </CategoryProvider>
  )
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const session = await getSession({ req })
  const layout: LayoutProps = {
    bannerProps: {
      showBanner: false,
    },
  }

  if (!session) {
    return loginRedirect(Routes.MainCategories)
  }

  const client = createDmrClient()

  const mainCategoriesPromise = client
    .withMiddleware(new AuthMiddleware(session.accessToken))
    .getMainCategories({
      pageSize: 1000,
    })

  const categoriesPromise = client
    .withMiddleware(new AuthMiddleware(session.accessToken))
    .getCategories({
      pageSize: 1000,
    })

  const departmentsPromise = client
    .withMiddleware(new AuthMiddleware(session.accessToken))
    .getDepartments({ pageSize: 10 })

  const [mainCategories, categories, departments] = await Promise.all([
    mainCategoriesPromise,
    categoriesPromise,
    departmentsPromise,
  ])

  return {
    props: {
      layout,
      mainCategories: mainCategories.mainCategories,
      categories: categories.categories,
      departments: departments.departments,
    },
  }
}
