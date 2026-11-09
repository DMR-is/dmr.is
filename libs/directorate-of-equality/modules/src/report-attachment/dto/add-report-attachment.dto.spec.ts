import { plainToInstance } from 'class-transformer'
import { validateSync } from 'class-validator'

import { ReportAttachmentExtensionEnum } from '../models/report-attachment.model'
import { PresignReportAttachmentDto } from './add-report-attachment.dto'

const validate = (extension: unknown) => {
  const dto = plainToInstance(PresignReportAttachmentDto, { extension })
  return {
    dto,
    errors: validateSync(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  }
}

describe('PresignReportAttachmentDto', () => {
  it.each(['xlsx', 'XLSX', '.xlsx', ' .Xlsx '])('accepts %p as xlsx', (raw) => {
    const { dto, errors } = validate(raw)

    expect(errors).toHaveLength(0)
    expect(dto.extension).toBe(ReportAttachmentExtensionEnum.XLSX)
  })

  it.each(['xlsm', 'exe', '', 42])('rejects %p', (raw) => {
    expect(validate(raw).errors).not.toHaveLength(0)
  })
})
