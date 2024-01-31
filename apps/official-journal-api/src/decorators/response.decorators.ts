import { applyDecorators } from '@nestjs/common'
import { ApiResponse } from '@nestjs/swagger'
import {
  JournalValidateSuccessResponse,
  JournalValidateErrorResponse,
} from '../dto/journal-advert-responses.dto'

export function ValidationResponses() {
  return applyDecorators(
    ApiResponse({
      status: 200,
      type: JournalValidateSuccessResponse,
      description: 'Validation success',
    }),
    ApiResponse({
      status: 400,
      type: JournalValidateErrorResponse,
      description: 'Validation failed',
    }),
  )
}
