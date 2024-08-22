import { ALLOWED_MIME_TYPES } from '@dmr.is/constants'
import { FileValidator } from '@nestjs/common'
import { IFile } from '@nestjs/common/pipes/file/interfaces'
import { extensions } from 'mime-types'

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

    const fileExtensions = extensions[file.mimetype]

    const fileExtension = Array.isArray(fileExtensions)
      ? fileExtensions[0]
      : fileExtensions

    const allowedExtensions = allowFileTypes
      .map((type) => extensions[type])
      .flat()
      .join(', ')

    return `File type ${
      fileExtension ? `.${fileExtension}` : ''
    } is not allowed, allowed types are ${allowedExtensions}`
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
