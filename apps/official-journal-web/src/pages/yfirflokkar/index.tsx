import {
  GridColumn,
  GridContainer,
  GridRow,
  Select,
} from '@island.is/island-ui/core'

import { Section } from '../../components/section/Section'
import { useMainCategories } from '../../hooks/api'
import { LayoutProps } from '../../layout/Layout'

export default function CasePublishingOverview() {
  const { data } = useMainCategories({
    params: {
      pageSize: 100,
    },
  })

  console.log(data)

  // const mainCategoryOptions = mainCategories.map((category) => ({
  //   label: category.title,
  //   value: category.id,
  // }))

  return (
    <Section>
      <GridContainer>
        <GridRow>
          <GridColumn>
            <h2>Yfirflokkar</h2>
            <Select></Select>
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
