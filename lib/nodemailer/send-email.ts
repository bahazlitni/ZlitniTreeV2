import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

import { requiredEnv } from "@/lib/utils";

type SendEmailParams = {
  to: string;
  replyTo?: string;
  subject: string;
  html: string;
  text?: string;
};

export function sendEmail(
  transporter: nodemailer.Transporter<
    SMTPTransport.SentMessageInfo,
    SMTPTransport.Options
  >,
  params: SendEmailParams,
) {
  return transporter.sendMail({
    from: requiredEnv("SMTP_FROM"),
    to: params.to,
    replyTo: params.replyTo,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });
}
