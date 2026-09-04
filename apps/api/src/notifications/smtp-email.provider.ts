import { Injectable } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';
import type { EmailMessage, EmailProvider } from './email-provider';

type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  password?: string;
  from: string;
  connectionTimeoutMs: number;
  greetingTimeoutMs: number;
  socketTimeoutMs: number;
};

@Injectable()
export class SmtpEmailProvider implements EmailProvider {
  private readonly transporter?: Transporter;
  private readonly from?: string;

  constructor() {
    const config = this.readConfig();
    if (!config) return;
    this.transporter = createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.user ? { user: config.user, pass: config.password ?? '' } : undefined,
      connectionTimeout: config.connectionTimeoutMs,
      greetingTimeout: config.greetingTimeoutMs,
      socketTimeout: config.socketTimeoutMs,
    });
    this.from = config.from;
  }

  async send(message: EmailMessage) {
    if (!this.transporter || !this.from) throw new Error('SMTP email delivery is not configured');
    await this.transporter.sendMail({ from: this.from, to: message.to, subject: message.subject, text: message.text });
  }

  private readConfig(): SmtpConfig | undefined {
    const host = process.env.SMTP_HOST?.trim();
    const from = process.env.SMTP_FROM?.trim();
    if (!host && !from) return undefined;
    if (!host || !from) throw new Error('SMTP_HOST and SMTP_FROM must both be configured');
    const port = Number(process.env.SMTP_PORT ?? 587);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('SMTP_PORT must be a valid TCP port');
    const secure = (process.env.SMTP_SECURE ?? 'false').toLowerCase() === 'true';
    return {
      host,
      port,
      secure,
      user: process.env.SMTP_USER?.trim() || undefined,
      password: process.env.SMTP_PASSWORD,
      from,
      connectionTimeoutMs: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS ?? 10000),
      greetingTimeoutMs: Number(process.env.SMTP_GREETING_TIMEOUT_MS ?? 10000),
      socketTimeoutMs: Number(process.env.SMTP_SOCKET_TIMEOUT_MS ?? 20000),
    };
  }
}
