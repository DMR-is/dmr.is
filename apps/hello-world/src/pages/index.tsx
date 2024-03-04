import { Box, Text, Button } from '@island.is/island-ui/core'
import { Layout } from '../components/layout/Layout'
import { Banner } from '../components/banner/Banner'

type Props = {}

export default function HomePage() {
  return (
    <Layout>
      <Banner />
      <Box style={{ maxWidth: 888, marginInline: 'auto' }}>
        <Text variant="h2">Halló</Text>
        <Button>click me</Button>
      </Box>
    </Layout>
  )
}
