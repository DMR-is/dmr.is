import { ALLOWED_MIME_TYPES } from '@dmr.is/constants'
import { FileValidator } from '@nestjs/common'
import { IFile } from '@nestjs/common/pipes/file/interfaces'
import { extensions } from 'mime-types'

interface FileAttributes {
  mimetype: string[]
  maxNumberOfFiles?: number
}
export class FileTypeValidationPipe extends FileValidator<
  FileAttributes,
  IFile
> {
  protected override validationOptions: FileAttributes = {
    mimetype: ALLOWED_MIME_TYPES,
    maxNumberOfFiles: 5,
  }
  buildErrorMessage(file: any): string {
    const allowFileTypes = Array.isArray(this.validationOptions.mimetype)
      ? this.validationOptions.mimetype
      : [this.validationOptions.mimetype]

    const maxNumberOfFiles = this.validationOptions.maxNumberOfFiles ?? 5

    if (Array.isArray(file) && file.length > maxNumberOfFiles) {
      return `Maximum of ${maxNumberOfFiles} files are allowed`
    }

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

    const maxNumberOfFiles = this.validationOptions.maxNumberOfFiles ?? 5
    if (Array.isArray(files)) {
      if (maxNumberOfFiles < files.length) {
        return false
      }

      return files.some((file) =>
        this.validationOptions.mimetype.includes(file.mimetype),
      )
    }

    return ALLOWED_MIME_TYPES.includes(files.mimetype)
  }
}
