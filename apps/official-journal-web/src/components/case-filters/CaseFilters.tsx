import { Box, Button, Input } from '@island.is/island-ui/core'
import * as styles from './CaseFilters.css'
import { useFilterContext } from '../../hooks/useFilterContext'

export const CaseFilters = () => {
  const { setSearchFilter } = useFilterContext()

  return (
    <Box className={styles.caseFilters()}>
      <Input
        size="sm"
        icon={{ name: 'search', type: 'outline' }}
        backgroundColor="blue"
        name="filter"
        placeholder="Leita eftir málsnafni"
        onChange={(e) => setSearchFilter(e.target.value)}
      />
      <Button variant="utility" icon="filter">
        Opna síu
      </Button>
    </Box>
  )
}
