import { Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { v4 as uuid } from 'uuid'
import { LogAndHandle, Transactional } from '@dmr.is/decorators'
import { Logger, LOGGER_PROVIDER } from '@dmr.is/logging'
import {
  CreateSignature,
  CreateSignatureMember,
  GetSignature,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'

import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { AdvertInvolvedPartyModel } from '../journal/models'
import { signatureMigrate } from './migrations/signature.migrate'
import { SignatureModel } from './models/signature.model'
import { SignatureMemberModel } from './models/signature-member.model'
import { SignatureRecordModel } from './models/signature-record.model'
import { ISignatureService } from './signature.service.interface'
import { signatureTemplate } from './utils'

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
    @Inject(LOGGER_PROVIDER) private readonly logger: Logger,
    private readonly sequelize: Sequelize,
  ) {}

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
        signatureDate: body.signatureDate,
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
          additional: recordBody.additonal,
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

    const newSignature = await this.signatureModel.findByPk(signatureId, {
      include: [
        { model: AdvertInvolvedPartyModel },
        {
          model: SignatureRecordModel,
          include: [
            {
              model: SignatureMemberModel,
              as: 'chairman',
            },
            {
              model: SignatureMemberModel,
              as: 'members',
            },
          ],
        },
      ],
      transaction,
    })

    if (!newSignature) {
      this.logger.warn('Failed to get signature after creation', {
        context: LOGGING_CONTEXT,
        category: LOGGING_CATEGORY,
        signature_id: signatureId,
      })

      throw new InternalServerErrorException('Could not create signature')
    }

    const html = newSignature.records
      .map((record) => signatureTemplate(record))
      .join('')

    const updated = await newSignature.update({ html }, { transaction })

    return ResultWrapper.ok({
      signature: signatureMigrate(updated),
    })
  }
}
