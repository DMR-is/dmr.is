import { WITH_CASE_KEY } from '@dmr.is/constants'

import { SetMetadata } from '@nestjs/common'

/** If the route is available before a case is created for said application */
export const WithCase = (val = true) => SetMetadata(WITH_CASE_KEY, val)
