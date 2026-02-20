import { Stack } from '@dmr.is/ui/components/island-is/Stack'

import { NavigateBack } from '../../../../components/client-components/navigate-back/NavigateBack'
import { SearchSidebar } from '../../../../components/client-components/search-page/sidebar/Sidebar'

export default function SearchPageSidebar() {
  return (
    <Stack space={[1, 2]}>
      <NavigateBack url="/" />
      <SearchSidebar />
    </Stack>
  )
}
