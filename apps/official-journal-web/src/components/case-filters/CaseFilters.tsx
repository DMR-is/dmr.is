import { useEffect, useState } from 'react'
import { useDebounce } from 'react-use'

import {
  Box,
  Button,
  Icon,
  Inline,
  Input,
  SkeletonLoader,
  Tag,
  Text,
} from '@island.is/island-ui/core'

import { useIsMounted } from '../../hooks/useIsMounted'
import { handleFilterToggle } from '../../lib/utils'
import { FilterGroup } from '../filter-group/FilterGroup'
import { FilterPopover } from '../filter-popover/FilterPopover'
import { Popover } from '../popover/Popover'
import * as styles from './CaseFilters.css'
import { messages } from './messages'

export type ActiveFilters = Array<{ key: string; value: string }>

export const CaseFilters = () => {
  const isMounted = useIsMounted()

  return <Box></Box>
}
