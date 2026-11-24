import { createNamespace, destroyNamespace } from 'cls-hooked'
import { Transaction } from 'sequelize'

import { CLS_NAMESPACE } from '@dmr.is/constants'

import type { AdvertModel } from '../../models/advert.model'
import { lockAdvertRow, lockAdvertRows } from './advert-lock'

describe('advert-lock', () => {
  const scoped = { findByPk: jest.fn(), findAll: jest.fn() }
  const unscoped = { findByPk: jest.fn(), findAll: jest.fn() }
  const model = {
    ...scoped,
    unscoped: jest.fn().mockReturnValue(unscoped),
  } as unknown as typeof AdvertModel
  const tx = { id: 'explicit' } as unknown as Transaction
  const clsTx = { id: 'cls' } as unknown as Transaction

  beforeEach(() => {
    jest.clearAllMocks()
    unscoped.findByPk.mockResolvedValue({ id: 'a' })
    unscoped.findAll.mockResolvedValue([])
  })

  describe('lockAdvertRow', () => {
    it('locks on the unscoped model with NO KEY UPDATE and the id first', async () => {
      await lockAdvertRow(model, 'a', {
        transaction: tx,
        attributes: ['statusId', 'id'],
      })

      expect(scoped.findByPk).not.toHaveBeenCalled()
      expect(unscoped.findByPk).toHaveBeenCalledWith('a', {
        attributes: ['id', 'statusId'],
        transaction: tx,
        lock: Transaction.LOCK.NO_KEY_UPDATE,
      })
    })

    it('throws with no explicit and no CLS transaction', async () => {
      await expect(lockAdvertRow(model, 'a')).rejects.toThrow(
        'Locking an advert row needs a transaction',
      )
      expect(unscoped.findByPk).not.toHaveBeenCalled()
    })

    it('uses the CLS transaction when none is passed', async () => {
      const ns = createNamespace(CLS_NAMESPACE)
      try {
        await ns.runAndReturn(async () => {
          ns.set('transaction', clsTx)
          await lockAdvertRow(model, 'a')
        })
      } finally {
        destroyNamespace(CLS_NAMESPACE)
      }

      expect(unscoped.findByPk).toHaveBeenCalledWith(
        'a',
        expect.objectContaining({ transaction: clsTx }),
      )
    })

    it('prefers the explicit transaction over the CLS one', async () => {
      const ns = createNamespace(CLS_NAMESPACE)
      try {
        await ns.runAndReturn(async () => {
          ns.set('transaction', clsTx)
          await lockAdvertRow(model, 'a', { transaction: tx })
          await lockAdvertRows(model, { id: 'a' }, { transaction: tx })
        })
      } finally {
        destroyNamespace(CLS_NAMESPACE)
      }

      expect(unscoped.findByPk).toHaveBeenCalledWith(
        'a',
        expect.objectContaining({ transaction: tx }),
      )
      expect(unscoped.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ transaction: tx }),
      )
    })
  })

  describe('lockAdvertRows', () => {
    it('uses the CLS transaction when none is passed', async () => {
      const ns = createNamespace(CLS_NAMESPACE)
      try {
        await ns.runAndReturn(async () => {
          ns.set('transaction', clsTx)
          await lockAdvertRows(model, { id: 'a' })
        })
      } finally {
        destroyNamespace(CLS_NAMESPACE)
      }

      expect(unscoped.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ transaction: clsTx }),
      )
    })

    it('locks in id order on the unscoped model', async () => {
      const where = { id: ['b', 'a'] }

      await lockAdvertRows(model, where, { transaction: tx })

      expect(scoped.findAll).not.toHaveBeenCalled()
      expect(unscoped.findAll).toHaveBeenCalledWith({
        where,
        attributes: ['id'],
        order: [['id', 'ASC']],
        transaction: tx,
        lock: Transaction.LOCK.NO_KEY_UPDATE,
      })
    })

    it('throws with no explicit and no CLS transaction', async () => {
      await expect(lockAdvertRows(model, {})).rejects.toThrow(
        'Locking an advert row needs a transaction',
      )
    })
  })
})
