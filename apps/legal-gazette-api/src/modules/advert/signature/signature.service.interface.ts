import {
  CreateSignatureDto,
  SignatureDto,
  UpdateSignatureDto,
} from '../../../models/signature.model'

export interface ISignatureService {
  getSignatureById(id: string): Promise<SignatureDto>

  getAdvertSignature(advertId: string): Promise<SignatureDto>

  updateSignature(
    id: string,
    advertId: string,
    body: UpdateSignatureDto,
  ): Promise<SignatureDto>

  createSignature(
    advertId: string,
    body: CreateSignatureDto,
  ): Promise<SignatureDto>
}

export const ISignatureService = Symbol('ISignatureService')
