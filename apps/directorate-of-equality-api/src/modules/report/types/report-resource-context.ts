import { ReportStatusEnum } from '../models/report.model'

export enum ReportRoleEnum {
  REVIEWER = 'REVIEWER',
  COMPANY = 'COMPANY',
}

export type ReportResourceActor =
  | {
      kind: ReportRoleEnum.REVIEWER
      userId: string
    }
  | {
      kind: ReportRoleEnum.COMPANY
      nationalId: string
    }

export type ReportResourceContext = {
  reportId: string
  reportStatus: ReportStatusEnum
  actor: ReportResourceActor
}
