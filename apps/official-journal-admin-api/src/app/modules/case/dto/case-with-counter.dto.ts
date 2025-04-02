import { Case } from '@dmr.is/official-journal/dto/case/case.dto'
import { Paging } from '@dmr.is/shared/dto'

import { ApiProperty } from '@nestjs/swagger'

export class DepartmentCounter {
  @ApiProperty({
    name: 'department',
    type: String,
  })
  department!: string

  @ApiProperty({
    type: Number,
    name: 'count',
  })
  count!: number
}

export class StatusCounter {
  @ApiProperty({
    name: 'status',
    type: String,
  })
  status!: string

  @ApiProperty({
    type: Number,
    name: 'count',
  })
  count!: number
}
export class GetCasesWithDepartmentCount {
  @ApiProperty({
    type: [DepartmentCounter],
  })
  departments!: DepartmentCounter[]

  @ApiProperty({
    type: [Case],
    name: 'cases',
  })
  cases!: Case[]

  @ApiProperty({
    description: 'Paging info',
    type: Paging,
  })
  paging!: Paging
}

export class GetCasesWithStatusCount {
  @ApiProperty({
    type: [StatusCounter],
  })
  statuses!: StatusCounter[]

  @ApiProperty({
    type: [Case],
    name: 'cases',
  })
  cases!: Case[]

  @ApiProperty({
    description: 'Paging info',
    type: Paging,
  })
  paging!: Paging
}
