import { Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { v4 as uuid } from 'uuid'

import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  CreateSignature,
  CreateSignatureMember,
  GetSignature,
  UpdateSignatureMember,
  UpdateSignatureRecord,
} from '@dmr.is/shared-dto'
import { ResultWrapper } from '@dmr.is/types'

import { CaseModel } from '../case/models'
import { MemberTypeEnum } from './lib/types'
import { signatureMigrate } from './migrations/signature.migrate'
import { SignatureModel } from './models/signature.model'
import { SignatureMemberModel } from './models/signature-member.model'
import { SignatureRecordModel } from './models/signature-record.model'
import { ISignatureService } from './signature.service.interface'
import { SIGNATURE_INCLUDES, signatureTemplate } from './utils'

const LOGGING_CONTEXT = 'SignatureService'
const LOGGING_CATEGORY = 'signature-service'

@Injectable()
export class SignatureService implements ISignatureService {
  constructor(
    @InjectModel(SignatureModel)
    private readonly signatureModel: typeof SignatureModel,
    @InjectModel(SignatureMemberModel)
    private readonly signatureMemberModel: typeof SignatureMemberModel,
    @InjectModel(SignatureRecordModel)
    private readonly signatureRecordModel: typeof SignatureRecordModel,
    @InjectModel(CaseModel) private readonly caseModel: typeof CaseModel,
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    private readonly sequelize: Sequelize,
  ) {}

  @Transactional()
  // eslint-disable-next-line @typescript-eslint/naming-convention
  private async _getSignature(signatureId: string, transaction?: Transaction) {
    const signature = await this.signatureModel.findByPk(signatureId, {
      include: SIGNATURE_INCLUDES,
      order: [
        [
          { model: SignatureRecordModel, as: 'records' },
          'signatureDate',
          'ASC',
        ],
        [Sequelize.literal('"records.members.created"'), 'ASC'],
      ],
      transaction,
    })

    return signature
  }

  @Transactional()
  // eslint-disable-next-line @typescript-eslint/naming-convention
  private async _findSignature(whereParams = {}, transaction?: Transaction) {
    // we always return the latest signature
    const signature = await this.signatureModel.findAll({
      where: whereParams,
      include: SIGNATURE_INCLUDES,
      subQuery: false,
      order: [
        ['created', 'DESC'],
        [
          { model: SignatureRecordModel, as: 'records' },
          'signatureDate',
          'ASC',
        ],
        [Sequelize.literal('"records.members.created"'), 'ASC'],
      ],
      transaction,
    })

    return Array.isArray(signature) && signature.length > 0
      ? signature[0]
      : null
  }

  @LogAndHandle()
  @Transactional()
  // eslint-disable-next-line @typescript-eslint/naming-convention
  private async _updateSignature(
    signatureId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<SignatureModel>> {
    const signature = await this._getSignature(signatureId, transaction)

    if (!signature) {
      this.logger.warn('Signature not found', {
        context: LOGGING_CONTEXT,
        category: LOGGING_CATEGORY,
        signature_id: signatureId,
      })

      throw new NotFoundException('Signature not found')
    }

    const html = signature.records
      .map((record) => signatureTemplate(record))
      .join('')

    const signatureDates = signature.records
      .map((record) => new Date(record.signatureDate))
      .filter((date) => !isNaN(date.getTime()))

    const signatureDate =
      signatureDates.length > 0
        ? signatureDates.reduce(
            (latest, date) => (date > latest ? date : latest),
            signatureDates[0],
          )
        : new Date()

    const fullYear = signatureDate.getFullYear().toString()

    const updated = await signature.update(
      { html, signatureDate: signatureDate.toISOString() },
      { transaction },
    )
    await this.updateCaseYearBySignature(signatureId, fullYear, transaction)

    return ResultWrapper.ok(updated)
  }

  @LogAndHandle()
  @Transactional()
  async updateSignatureRecord(
    signatureId: string,
    recordId: string,
    body: UpdateSignatureRecord,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const record = await this.signatureRecordModel.findByPk(recordId, {
      include: [
        {
          model: SignatureModel,
          where: {
            id: signatureId,
          },
        },
      ],
      transaction,
    })

    if (!record) {
      this.logger.warn('Signature record not found', {
        context: LOGGING_CONTEXT,
        category: LOGGING_CATEGORY,
        signature_id: signatureId,
        record_id: recordId,
      })

      throw new NotFoundException('Signature record not found')
    }

    await record.update({ ...body }, { transaction })
    await this._updateSignature(signatureId, transaction)

    return ResultWrapper.ok()
  }

  private async updateCaseYearBySignature(
    signatureId: string,
    newYear: string,
    transaction?: Transaction,
  ): Promise<void> {
    const signature = await this._getSignature(signatureId, transaction)

    if (!signature) {
      this.logger.warn('Signature not found', {
        context: LOGGING_CONTEXT,
        category: LOGGING_CATEGORY,
        signature_id: signatureId,
      })

      throw new NotFoundException('Signature not found')
    }

    const caseId = signature.caseId

    if (caseId) {
      const caseModel = await this.caseModel.findByPk(caseId, { transaction })

      if (caseModel) {
        await caseModel.update({ year: newYear }, { transaction })
      }
    }
  }

  async updateSignatureMember(
    signatureId: string,
    recordId: string,
    memberId: string,
    body: UpdateSignatureMember,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const signatureMember = await this.signatureMemberModel.findByPk(memberId, {
      include: [
        {
          model: SignatureRecordModel,
          where: { signatureId: signatureId },
        },
      ],
      transaction,
    })

    if (!signatureMember) {
      this.logger.warn('Signature member not found', {
        context: LOGGING_CONTEXT,
        category: LOGGING_CATEGORY,
        signature_id: signatureId,
        record_id: recordId,
        member_id: memberId,
      })

      throw new NotFoundException('Signature member not found')
    }

    await signatureMember.update(body, { transaction })
    await this._updateSignature(signatureId, transaction)

    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async createSignatureRecordMember(
    recordId: string,
    body: CreateSignatureMember,
    transaction?: Transaction,
  ): Promise<ResultWrapper<{ id: string }>> {
    const memberId = uuid()

    const createResult = await this.signatureMemberModel.create(
      {
        id: memberId,
        name: body.name,
        textAbove: body.textAbove,
        textAfter: body.textAfter,
        textBelow: body.textBelow,
        signatureRecordId: recordId,
      },
      { transaction, returning: ['id'] },
    )

    return ResultWrapper.ok({ id: createResult.id })
  }

  @LogAndHandle()
  @Transactional()
  async createSignature(
    caseId: string,
    body: CreateSignature,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetSignature>> {
    const signatureId = uuid()
    const now = new Date()

    await this.signatureModel.create(
      {
        id: signatureId,
        signatureDate: now.toISOString(),
        html: '',
        involvedPartyId: body.involvedPartyId,
        caseId: caseId,
        advertId: null,
        created: now,
      },
      { transaction },
    )

    for (const recordBody of body.records) {
      const recordId = uuid()

      const record = await this.signatureRecordModel.create(
        {
          id: recordId,
          institution: recordBody.institution,
          signatureDate: recordBody.signatureDate,
          additional: recordBody.additional,
          signatureId: signatureId,
          chairmanId: null,
        },
        { transaction },
      )

      if (recordBody.chairman) {
        const { id: chairmanId } = ResultWrapper.unwrap(
          await this.createSignatureRecordMember(
            recordId,
            recordBody.chairman,
            transaction,
          ),
        )

        await record.update({ chairmanId: chairmanId }, { transaction })
      }

      for (const memberBody of recordBody.members) {
        ResultWrapper.unwrap(
          await this.createSignatureRecordMember(
            recordId,
            memberBody,
            transaction,
          ),
        )
      }
    }

    const updated = ResultWrapper.unwrap(
      await this._updateSignature(signatureId, transaction),
    )
    const mapped = signatureMigrate(updated)

    return ResultWrapper.ok({
      signature: mapped,
    })
  }

  @LogAndHandle()
  @Transactional()
  async getSignatureForInvolvedParty(
    involvedPartyId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetSignature>> {
    const signature = await this._findSignature(
      { involvedPartyId },
      transaction,
    )

    if (!signature) {
      this.logger.warn('Signature not found', {
        context: LOGGING_CONTEXT,
        category: LOGGING_CATEGORY,
        involved_party_id: involvedPartyId,
      })

      throw new NotFoundException('Signature not found')
    }

    const mapped = signatureMigrate(signature)

    return ResultWrapper.ok({
      signature: mapped,
    })
  }

  @LogAndHandle()
  @Transactional()
  async getSignature(signatureId: string, transaction?: Transaction) {
    const signature = await this._getSignature(signatureId, transaction)

    if (!signature) {
      this.logger.warn('Signature not found', {
        context: LOGGING_CONTEXT,
        category: LOGGING_CATEGORY,
        signature_id: signatureId,
      })

      throw new NotFoundException('Signature not found')
    }

    const mapped = signatureMigrate(signature)

    return ResultWrapper.ok({
      signature: mapped,
    })
  }

  @LogAndHandle()
  @Transactional()
  async getSignatureByCaseId(
    caseId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper<GetSignature>> {
    const signature = await this._findSignature({ caseId }, transaction)

    if (!signature) {
      this.logger.warn('Signature not found', {
        context: LOGGING_CONTEXT,
        category: LOGGING_CATEGORY,
        case_id: caseId,
      })

      throw new NotFoundException('Signature not found')
    }

    const mapped = signatureMigrate(signature)

    return ResultWrapper.ok({
      signature: mapped,
    })
  }

  async createSignatureMember(
    signatureId: string,
    recordId: string,
    memberType: MemberTypeEnum,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const memberId = uuid()

    const record = await this.signatureRecordModel.findByPk(recordId, {
      include: [
        {
          model: SignatureModel,
          where: {
            id: signatureId,
          },
        },
      ],
      transaction,
    })

    if (!record) {
      this.logger.warn('Signature record not found', {
        context: LOGGING_CONTEXT,
        category: LOGGING_CATEGORY,
        signature_id: signatureId,
        record_id: recordId,
      })

      throw new NotFoundException('Signature record not found')
    }

    await this.signatureMemberModel.create(
      {
        id: memberId,
        name: '',
        textAbove: '',
        textAfter: '',
        textBelow: '',
        signatureRecordId: record.id,
      },
      { transaction, returning: ['id'] },
    )

    if (memberType === MemberTypeEnum.CHAIRMAN) {
      await record.update({ chairmanId: memberId }, { transaction })
    }

    await this._updateSignature(signatureId, transaction)
    return ResultWrapper.ok()
  }

  async deleteSignatureMember(
    signatureId: string,
    recordId: string,
    memberId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const recordPromise = this.signatureRecordModel.findByPk(recordId, {
      include: [
        {
          model: SignatureModel,
          where: {
            id: signatureId,
          },
        },
      ],
      transaction,
    })
    const signatureMemberPromise = this.signatureMemberModel.findByPk(
      memberId,
      {
        include: [
          {
            model: SignatureRecordModel,
            where: { signatureId: signatureId },
          },
        ],
        transaction,
      },
    )

    const [record, signatureMember] = await Promise.all([
      recordPromise,
      signatureMemberPromise,
    ])

    if (!record || !signatureMember) {
      this.logger.warn('Signature member not found', {
        context: LOGGING_CONTEXT,
        category: LOGGING_CATEGORY,
        signature_id: signatureId,
        record_id: recordId,
        member_id: memberId,
      })

      throw new NotFoundException('Signature member not found')
    }

    if (memberId === record.chairmanId) {
      await record.update({ chairmanId: null }, { transaction })
    }
    await signatureMember.destroy({ transaction })
    await this._updateSignature(signatureId, transaction)

    return ResultWrapper.ok()
  }

  async createSignatureRecord(
    signatureId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const recordId = uuid()

    await this.signatureRecordModel.create(
      {
        id: recordId,
        institution: '',
        signatureDate: new Date().toISOString(),
        additional: '',
        signatureId: signatureId,
        chairmanId: null,
      },
      { transaction },
    )

    await this._updateSignature(signatureId, transaction)
    return ResultWrapper.ok()
  }

  @LogAndHandle()
  @Transactional()
  async deleteSignatureRecord(
    signatureId: string,
    recordId: string,
    transaction?: Transaction,
  ): Promise<ResultWrapper> {
    const record = await this.signatureRecordModel.findByPk(recordId, {
      include: [
        {
          model: SignatureModel,
          where: {
            id: signatureId,
          },
        },
      ],
      transaction,
    })

    if (!record) {
      this.logger.warn('Signature record not found', {
        context: LOGGING_CONTEXT,
        category: LOGGING_CATEGORY,
        signature_id: signatureId,
        record_id: recordId,
      })

      throw new NotFoundException('Signature record not found')
    }

    const members = await this.signatureMemberModel.findAll({
      where: {
        signatureRecordId: recordId,
      },
      transaction,
    })

    await record.update({ chairmanId: null }, { transaction })
    await Promise.all(members.map((member) => member.destroy({ transaction })))
    await record.destroy({ transaction })
    await this._updateSignature(signatureId, transaction)

    return ResultWrapper.ok()
  }
}
