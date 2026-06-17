import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      jsonTransport: true, // Development fallback: returns email content as JSON in response
    });
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const url = `http://localhost:3001/api/auth/verify-email?token=${token}`;

    this.logger.log('====================================================');
    this.logger.log(`📧 E-MAIL ENVIADO PARA: ${email}`);
    this.logger.log(`🔗 LINK DE CONFIRMAÇÃO: ${url}`);
    this.logger.log('====================================================');

    await this.transporter.sendMail({
      from: '"ProtomApp Support" <no-reply@protomapp.com>',
      to: email,
      subject: 'Confirme seu cadastro no ProtomApp',
      text: `Olá! Confirme seu cadastro no ProtomApp clicando no link: ${url}`,
      html: `<p>Olá!</p><p>Confirme seu cadastro no ProtomApp clicando no link abaixo:</p><p><a href="${url}">${url}</a></p>`,
    });
  }
}
