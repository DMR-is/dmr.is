import { ChangeLogAction, ChangeLogEntity } from '../../gen/fetch'

export const changeLogActionLabels: Record<ChangeLogAction, string> = {
  [ChangeLogAction.CREATE]: 'Stofnað',
  [ChangeLogAction.UPDATE]: 'Uppfært',
  [ChangeLogAction.DELETE]: 'Eytt',
  [ChangeLogAction.ATTACH]: 'Tengt',
  [ChangeLogAction.DETACH]: 'Aftengt',
  [ChangeLogAction.SETACTIVE]: 'Staða breytt',
  [ChangeLogAction.MOVE]: 'Auglýsingar færðar',
  [ChangeLogAction.REVERT]: 'Afturkallað',
}

export const changeLogEntityLabels: Record<ChangeLogEntity, string> = {
  [ChangeLogEntity.CATEGORY]: 'Flokkur',
  [ChangeLogEntity.TYPE]: 'Tegund',
  [ChangeLogEntity.CONNECTION]: 'Tenging',
}
