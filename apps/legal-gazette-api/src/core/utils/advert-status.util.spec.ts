import { BadRequestException } from '@nestjs/common'

// Mock StatusIdEnum to avoid circular dependencies in tests
jest.mock('../../models/status.model', () => ({
  StatusIdEnum: {
    SUBMITTED: 'cd3bf301-52a1-493e-8c80-a391c310c840',
    IN_PROGRESS: '7ef679c4-4f66-4892-b6ad-ee05e0be4359',
    READY_FOR_PUBLICATION: 'a2f3b1c4-2d5e-4a7b-8c6f-9d1e0f3a2b8c',
    PUBLISHED: 'bd835a1d-0ecb-4aa4-9910-b5e60c30dced',
    REJECTED: 'f3a0b1c4-2d5e-4a7b-8c6f-9d1e0f3a2b8c',
    WITHDRAWN: 'e2f3b1c4-2d5e-4a7b-8c6f-9d1e0f3a2b8c',
  },
}))

import { StatusIdEnum } from '../../models/status.model'
import {
  assertAdvertEditable,
  assertAdvertsEditable,
  NON_EDITABLE_STATUSES,
} from './advert-status.util'

describe('advert-status.util', () => {
  describe('NON_EDITABLE_STATUSES', () => {
    it('should include PUBLISHED status', () => {
      expect(NON_EDITABLE_STATUSES).toContain(StatusIdEnum.PUBLISHED)
    })

    it('should include REJECTED status', () => {
      expect(NON_EDITABLE_STATUSES).toContain(StatusIdEnum.REJECTED)
    })

    it('should include WITHDRAWN status', () => {
      expect(NON_EDITABLE_STATUSES).toContain(StatusIdEnum.WITHDRAWN)
    })

    it('should contain exactly three statuses', () => {
      expect(NON_EDITABLE_STATUSES).toHaveLength(3)
    })
  })

  describe('assertAdvertEditable', () => {
    it('should not throw for SUBMITTED status', () => {
      const advert = { statusId: StatusIdEnum.SUBMITTED }
      expect(() => assertAdvertEditable(advert)).not.toThrow()
    })

    it('should not throw for IN_PROGRESS status', () => {
      const advert = { statusId: StatusIdEnum.IN_PROGRESS }
      expect(() => assertAdvertEditable(advert)).not.toThrow()
    })

    it('should not throw for READY_FOR_PUBLICATION status', () => {
      const advert = { statusId: StatusIdEnum.READY_FOR_PUBLICATION }
      expect(() => assertAdvertEditable(advert)).not.toThrow()
    })

    it('should throw BadRequestException for PUBLISHED status', () => {
      const advert = { statusId: StatusIdEnum.PUBLISHED }
      expect(() => assertAdvertEditable(advert)).toThrow(BadRequestException)
    })

    it('should throw BadRequestException for REJECTED status', () => {
      const advert = { statusId: StatusIdEnum.REJECTED }
      expect(() => assertAdvertEditable(advert)).toThrow(BadRequestException)
    })

    it('should throw BadRequestException for WITHDRAWN status', () => {
      const advert = { statusId: StatusIdEnum.WITHDRAWN }
      expect(() => assertAdvertEditable(advert)).toThrow(BadRequestException)
    })

    it('should include default context in error message', () => {
      const advert = { statusId: StatusIdEnum.PUBLISHED }
      expect(() => assertAdvertEditable(advert)).toThrow(
        'Cannot modify advert - advert is in a terminal state',
      )
    })

    it('should include custom context in error message when provided', () => {
      const advert = { statusId: StatusIdEnum.PUBLISHED }
      expect(() => assertAdvertEditable(advert, 'signature')).toThrow(
        'Cannot modify signature - advert is in a terminal state',
      )
    })

    it('should include custom context for REJECTED status', () => {
      const advert = { statusId: StatusIdEnum.REJECTED }
      expect(() => assertAdvertEditable(advert, 'settlement')).toThrow(
        'Cannot modify settlement - advert is in a terminal state',
      )
    })
  })

  describe('assertAdvertsEditable', () => {
    it('should not throw when all adverts are editable', () => {
      const adverts = [
        { statusId: StatusIdEnum.SUBMITTED },
        { statusId: StatusIdEnum.IN_PROGRESS },
        { statusId: StatusIdEnum.READY_FOR_PUBLICATION },
      ]
      expect(() => assertAdvertsEditable(adverts)).not.toThrow()
    })

    it('should throw when any advert is PUBLISHED', () => {
      const adverts = [
        { statusId: StatusIdEnum.SUBMITTED },
        { statusId: StatusIdEnum.PUBLISHED },
      ]
      expect(() => assertAdvertsEditable(adverts)).toThrow(BadRequestException)
    })

    it('should throw when any advert is REJECTED', () => {
      const adverts = [
        { statusId: StatusIdEnum.IN_PROGRESS },
        { statusId: StatusIdEnum.REJECTED },
      ]
      expect(() => assertAdvertsEditable(adverts)).toThrow(BadRequestException)
    })

    it('should throw when any advert is WITHDRAWN', () => {
      const adverts = [
        { statusId: StatusIdEnum.READY_FOR_PUBLICATION },
        { statusId: StatusIdEnum.WITHDRAWN },
      ]
      expect(() => assertAdvertsEditable(adverts)).toThrow(BadRequestException)
    })

    it('should not throw for empty array', () => {
      expect(() => assertAdvertsEditable([])).not.toThrow()
    })

    it('should include default context in error message', () => {
      const adverts = [{ statusId: StatusIdEnum.PUBLISHED }]
      expect(() => assertAdvertsEditable(adverts)).toThrow(
        'Cannot modify record - has published/finalized adverts',
      )
    })

    it('should include custom context in error message when provided', () => {
      const adverts = [{ statusId: StatusIdEnum.PUBLISHED }]
      expect(() => assertAdvertsEditable(adverts, 'settlement')).toThrow(
        'Cannot modify settlement - has published/finalized adverts',
      )
    })

    it('should throw when multiple adverts are non-editable', () => {
      const adverts = [
        { statusId: StatusIdEnum.PUBLISHED },
        { statusId: StatusIdEnum.REJECTED },
        { statusId: StatusIdEnum.WITHDRAWN },
      ]
      expect(() => assertAdvertsEditable(adverts)).toThrow(BadRequestException)
    })

    it('should throw when only the last advert is non-editable', () => {
      const adverts = [
        { statusId: StatusIdEnum.SUBMITTED },
        { statusId: StatusIdEnum.IN_PROGRESS },
        { statusId: StatusIdEnum.PUBLISHED },
      ]
      expect(() => assertAdvertsEditable(adverts)).toThrow(BadRequestException)
    })
  })
})
