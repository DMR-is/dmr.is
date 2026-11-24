import { ChangeLogAction } from '../../gen/fetch'

export const changeLogActionLabels: Record<ChangeLogAction, string> = {
  [ChangeLogAction.CREATE]: 'Stofnað',
  [ChangeLogAction.UPDATE]: 'Uppfært',
  [ChangeLogAction.DELETE]: 'Eytt',
  [ChangeLogAction.ATTACH]: 'Tengt',
  [ChangeLogAction.DETACH]: 'Aftengt',
  [ChangeLogAction.SETACTIVE]: 'Staða breytt',
  // Kept short so the tag column stays narrow — the row sentence spells out
  // how many adverts moved and where.
  [ChangeLogAction.MOVE]: 'Færsla',
  [ChangeLogAction.REVERT]: 'Afturkallað',
}
