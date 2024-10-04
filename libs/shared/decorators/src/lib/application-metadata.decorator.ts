import { WITH_CASE_KEY } from '@dmr.is/constants'
import { SetMetadata } from '@nestjs/common'

export const WithCase = (val = true) => SetMetadata(WITH_CASE_KEY, val)
