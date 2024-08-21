// import {
//   PipeTransform,
//   Injectable,
//   ArgumentMetadata,
//   BadRequestException,
// } from '@nestjs/common'

import { ALLOWED_MIME_TYPES } from '@dmr.is/constants'
import { FileValidator } from '@nestjs/common'
import { IFile } from '@nestjs/common/pipes/file/interfaces'

interface FileAttributes {
  mimetype: string[]
}
export class FileTypeValidationPipe extends FileValidator<
  FileAttributes,
  IFile
> {
  protected validationOptions: FileAttributes = { mimetype: ALLOWED_MIME_TYPES }
  buildErrorMessage(file: any): string {
    const allowFileTypes = Array.isArray(this.validationOptions.mimetype)
      ? this.validationOptions.mimetype
      : [this.validationOptions.mimetype]

    const fileType = file.mimetype

    return `File type ${fileType} is not allowed, allowed types are ${allowFileTypes.join(
      ', ',
    )}`
  }

  isValid(files?: IFile | IFile[]): boolean | Promise<boolean> {
    if (!files) {
      return false
    }

    if (Array.isArray(files)) {
      return files.some((file) =>
        this.validationOptions.mimetype.includes(file.mimetype),
      )
    }

    return ALLOWED_MIME_TYPES.includes(files.mimetype)
  }
}
