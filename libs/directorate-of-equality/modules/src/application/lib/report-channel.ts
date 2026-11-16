import { ReportProviderEnum } from '../../report/models/report.enums'
import { ApplicationReportChannelEnum } from '../dto/application-report-list.dto'

/**
 * The stored provider type as the submissions list names it. A row with no
 * provider type predates the column being set; like SYSTEM it was not filed
 * by an upstream channel, so it reads as entered by the Directorate.
 */
export const toReportChannel = (
  providerType: ReportProviderEnum | null,
): ApplicationReportChannelEnum => {
  switch (providerType) {
    case ReportProviderEnum.ISLAND_IS:
      return ApplicationReportChannelEnum.ISLAND_IS
    case ReportProviderEnum.OTHER:
      return ApplicationReportChannelEnum.SERVICE_PROVIDER
    default:
      return ApplicationReportChannelEnum.DIRECTORATE
  }
}
