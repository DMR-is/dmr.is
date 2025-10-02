import nodemailer from 'nodemailer'
import Mail from 'nodemailer/lib/mailer'

import { Injectable } from '@nestjs/common'

import { ISESService } from './ses.service.interface'

@Injectable()
export class SESService implements ISESService {
  sendMail(message: Mail.Options): Promise<nodemailer.SentMessageInfo> {
    throw new Error('Method not implemented.')
  }
  // private readonly sesClient = new SESClient({
  //   region: process.env.AWS_REGION ?? 'eu-west-1',
  //   credentials: process.env.AWS_CREDENTIALS_SOURCE
  //     ? fromIni({ profile: process.env.AWS_CREDENTIALS_SOURCE })
  //     : undefined,
  // })

  // private readonly transporter = nodemailer.createTransport({
  //   SES: { ses: this.sesClient, aws: { SendRawEmailCommand } },
  // })

  // constructor() {
  //   if (!this.sesClient) {
  //     throw new Error(
  //       'Failed to create SES client, check your AWS environment variables',
  //     )
  //   }
  // }

  // async sendMail(message: Mail.Options): Promise<SentMessageInfo> {
  //   return await this.transporter.sendMail(message)
  // }
}
