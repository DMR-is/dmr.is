'use client'

import { PublicationSidebar } from '../components/client-components/detailed-page/Sidebar/PublicationSidebar'
import { AdvertPublicationDetailedDto } from '../gen/fetch'

interface PublicationSidebarContainerProps {
  publication: AdvertPublicationDetailedDto
}

export function PublicationSidebarContainer({
  publication,
}: PublicationSidebarContainerProps) {
  return <PublicationSidebar publication={publication} />
}
