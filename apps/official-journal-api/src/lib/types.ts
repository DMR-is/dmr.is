import {
  JournalValidateErrorResponse,
  JournalValidateSuccessResponse,
} from '../dto/journal-advert-responses.dto'

export type JournalValidationResponse =
  | JournalValidateSuccessResponse
  | JournalValidateErrorResponse
