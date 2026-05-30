import { requiredEnv } from "@/lib/utils";
import nodemailer from "nodemailer"

export function createTransporter() {
  return nodemailer.createTransport({
    host: requiredEnv("SMTP_HOST"),
    port: Number(requiredEnv("SMTP_PORT")),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: requiredEnv("SMTP_USER"),
      pass: requiredEnv("SMTP_PASS"),
    },
  });
}