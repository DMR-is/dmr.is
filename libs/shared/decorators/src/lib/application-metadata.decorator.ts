import { SetMetadata } from '@nestjs/common'

export const WithCase = (val = true) => SetMetadata('withCase', val)
