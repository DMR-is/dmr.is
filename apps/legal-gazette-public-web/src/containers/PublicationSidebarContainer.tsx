'use client'

import { PublicationSidebar } from '../components/client-components/detailed-page/Sidebar/PublicationSidebar'
import { PublicationDetails } from '../lib/trpc/types'

interface PublicationSidebarContainerProps {
  publication: PublicationDetails
}

export function PublicationSidebarContainer({
  publication,
}: PublicationSidebarContainerProps) {
  return <PublicationSidebar publication={publication} />
}
