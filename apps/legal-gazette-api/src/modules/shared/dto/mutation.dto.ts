import { ApiProperty } from "@nestjs/swagger"

export class MutationResponse {
  constructor(success: boolean) {
    this.success = success
  }
  @ApiProperty({ type: Boolean })
  success: boolean
}
