import { ReportStatusEnum } from '../models/report.model'

export enum ReportResourceActorKindEnum {
  REVIEWER = 'REVIEWER',
  CONTACT = 'CONTACT',
}

export type ReportResourceActor =
  | {
      kind: ReportResourceActorKindEnum.REVIEWER
      userId: string
    }
  | {
      kind: ReportResourceActorKindEnum.CONTACT
      nationalId: string
    }

export type ReportResourceContext = {
  reportId: string
  reportStatus: ReportStatusEnum
  actor: ReportResourceActor
}
