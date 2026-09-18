import { TypeIdEnum } from '../../models/type.model'
import { StatusIdEnum } from '../enums/status.enum'
import { isEstateOpen } from './estate.util'

describe('isEstateOpen', () => {
  // Postgres returns UUID columns lower-cased, so that is what a loaded advert
  // actually carries - the enums are written upper-case.
  const advert = (typeId: string, statusId: string) => ({
    typeId: typeId.toLowerCase(),
    statusId: statusId.toLowerCase(),
  })

  const divisionEnding = (statusId: string) =>
    advert(TypeIdEnum.DIVISION_ENDING, statusId)

  it('should be open when there are no adverts', () => {
    expect(isEstateOpen([])).toBe(true)
  })

  it('should be open with only a recall advert', () => {
    expect(
      isEstateOpen([
        advert(TypeIdEnum.RECALL_BANKRUPTCY, StatusIdEnum.PUBLISHED),
      ]),
    ).toBe(true)
  })

  it.each([
    ['submitted', StatusIdEnum.SUBMITTED],
    ['in progress', StatusIdEnum.IN_PROGRESS],
    ['ready for publication', StatusIdEnum.READY_FOR_PUBLICATION],
    ['in publishing', StatusIdEnum.IN_PUBLISHING],
    ['published', StatusIdEnum.PUBLISHED],
  ])('should be closed by a %s division ending', (_label, statusId) => {
    expect(isEstateOpen([divisionEnding(statusId)])).toBe(false)
  })

  it.each([
    ['rejected', StatusIdEnum.REJECTED],
    ['withdrawn', StatusIdEnum.WITHDRAWN],
  ])('should reopen once the division ending is %s', (_label, statusId) => {
    expect(isEstateOpen([divisionEnding(statusId)])).toBe(true)
  })

  it('should stay closed when a rejected division ending is followed by a live one', () => {
    expect(
      isEstateOpen([
        divisionEnding(StatusIdEnum.REJECTED),
        divisionEnding(StatusIdEnum.SUBMITTED),
      ]),
    ).toBe(false)
  })

  it('should not be closed by a division meeting', () => {
    expect(
      isEstateOpen([
        advert(TypeIdEnum.DIVISION_MEETING, StatusIdEnum.PUBLISHED),
      ]),
    ).toBe(true)
  })
})
