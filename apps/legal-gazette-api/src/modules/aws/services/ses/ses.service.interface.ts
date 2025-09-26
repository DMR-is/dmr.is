import { SentMessageInfo } from 'nodemailer'
import Mail from 'nodemailer/lib/mailer'

export interface ISESService {
  sendMail(message: Mail.Options): Promise<SentMessageInfo>
}

export const ISESService = Symbol('ISESService')
