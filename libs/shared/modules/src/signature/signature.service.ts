import { Op, Transaction } from 'sequelize'
import { Sequelize } from 'sequelize-typescript'
import { DEFAULT_PAGE_SIZE } from '@dmr.is/constants'
import { LogAndHandle } from '@dmr.is/decorators'
import {
  GetSignatureResponse,
  GetSignaturesQuery,
  GetSignaturesResponse,
  Signature,
} from '@dmr.is/shared/dto'
import { ResultWrapper } from '@dmr.is/types'
import { generatePaging } from '@dmr.is/utils'

import { NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import { SignatureModel } from './models'
import { ISignatureService } from './signature.service.interface'

export class SignatureService implements ISignatureService {
  constructor(
    @InjectModel(SignatureModel)
    private readonly signatureModel: typeof SignatureModel,
    private readonly sequelize: Sequelize,
  ) {}

  @LogAndHandle()
  async createSignature(): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }

  @LogAndHandle()
  async getSignature(id: string): Promise<ResultWrapper<GetSignatureResponse>> {
    const signature = await this.signatureModel.findByPk(id)

    if (!signature) {
      throw new NotFoundException(`Signature<${id}> not found`)
    }

    return ResultWrapper.ok({
      signature: signature as unknown as Signature,
    })
  }

  @LogAndHandle()
  async getSignatures(
    params?: GetSignaturesQuery,
  ): Promise<ResultWrapper<GetSignaturesResponse>> {
    const page = params?.page || 1
    const pageSize = params?.pageSize || DEFAULT_PAGE_SIZE

    // TODO: Implement search

    const signatures = await this.signatureModel.findAndCountAll({
      distinct: true,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      //where: {...},
    })

    const paging = generatePaging(
      signatures.rows,
      page,
      pageSize,
      signatures.count,
    )

    return ResultWrapper.ok({
      signatures: [],
      paging,
    })
  }

  @LogAndHandle()
  async updateSignature(): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
  @LogAndHandle()
  async deleteSignature(): Promise<ResultWrapper> {
    throw new Error('Method not implemented.')
  }
}
