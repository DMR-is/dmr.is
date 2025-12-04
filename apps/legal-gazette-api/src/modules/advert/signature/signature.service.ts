import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/sequelize'

import {
  CreateSignatureDto,
  SignatureDto,
  SignatureModel,
  UpdateSignatureDto,
} from '../../../models/signature.model'
import { ISignatureService } from './signature.service.interface'

@Injectable()
export class SignatureService implements ISignatureService {
  constructor(
    @InjectModel(SignatureModel)
    private readonly signatureModel: typeof SignatureModel,
  ) {}

  async getSignatureById(id: string): Promise<SignatureDto> {
    const signature = await this.signatureModel.findByPkOrThrow(id)

    return signature.fromModel()
  }

  async getAdvertSignature(advertId: string): Promise<SignatureDto> {
    const signature = await this.signatureModel.findOneOrThrow({
      where: { advertId },
    })

    return signature.fromModel()
  }

  async updateSignature(
    id: string,
    body: UpdateSignatureDto,
  ): Promise<SignatureDto> {
    const signature = await this.signatureModel.findByPkOrThrow(id)
    await signature.update(body)

    return signature.fromModel()
  }

  async createSignature(
    advertId: string,
    body: CreateSignatureDto,
  ): Promise<SignatureDto> {
    const signature = await this.signatureModel.create(
      {
        advertId,
        ...body,
      },
      {
        returning: true,
      },
    )

    return signature.fromModel()
  }
}
