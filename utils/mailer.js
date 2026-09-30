import fs from 'node:fs';
import path from 'node:path';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Outgoing email.
//   - SMTP_HOST set → real email via SMTP (SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE=true for port 465).
//   - Otherwise (local dev) → nothing is sent; each message is saved as JSON in
//     MAIL_OUTBOX_DIR (default ./data/outbox) and a one-line note is logged.
//   - Tests → messages are kept in `sentMail` so tests can inspect them.
// MAIL_FROM sets the sender, e.g. "Shoe Store <orders@example.com>".

const isTest = process.env.NODE_ENV === 'test';
const outboxDir = process.env.MAIL_OUTBOX_DIR || './data/outbox';

export const sentMail = [];

const transport = process.env.SMTP_HOST && !isTest
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    })
  : nodemailer.createTransport({ jsonTransport: true });

export const mailMode = process.env.SMTP_HOST && !isTest ? 'smtp' : isTest ? 'test' : 'outbox';

// Never throws: a failed email must not fail the checkout or status change that triggered it.
export const sendMail = async ({ to, subject, text, html }) => {
  if (!to) return null;
  const message = { from: process.env.MAIL_FROM || 'Shop <no-reply@localhost>', to, subject, text, html };
  try {
    const info = await transport.sendMail(message);
    if (mailMode === 'test') {
      sentMail.push(message);
    } else if (mailMode === 'outbox') {
      fs.mkdirSync(outboxDir, { recursive: true });
      const safeTo = String(to).replace(/[^\w.@-]/g, '_');
      const file = path.join(outboxDir, `${new Date().toISOString().replace(/[:.]/g, '-')}-${safeTo}.json`);
      fs.writeFileSync(file, JSON.stringify(message, null, 2));
      console.log(`✉  Email not sent (no SMTP configured) — saved to ${file}: "${subject}" → ${to}`);
    }
    return info;
  } catch (error) {
    console.error(`Email to ${to} failed ("${subject}"):`, error.message);
    return null;
  }
};
