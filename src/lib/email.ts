import nodemailer from 'nodemailer';
import { APP_NAME, APP_URL } from '@/lib/config';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function getFromAddress(): string {
  const from = process.env.EMAIL_FROM;
  if (!from) throw new Error('EMAIL_FROM is not configured');
  return from;
}

function getContactReceiver(): string {
  return process.env.CONTACT_RECEIVER_EMAIL || process.env.SMTP_USER || '';
}

function escape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function shell(heading: string, bodyHtml: string, preheader?: string): string {
  return `
    <!doctype html>
    <html>
      <body style="margin:0;padding:0;background-color:#0b0b0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e5e7eb;">
        ${preheader ? `<div style="display:none;max-height:0;overflow-hidden;">${preheader}</div>` : ''}
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#0b0b0f;padding:32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;background-color:#15151c;border:1px solid #27272a;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="padding:28px 32px 8px 32px;">
                    <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">${heading}</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 32px 28px 32px;font-size:15px;line-height:1.6;color:#d4d4d8;">
                    ${bodyHtml}
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 32px;border-top:1px solid #27272a;font-size:12px;color:#71717a;">
                    &copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export async function sendOrderConfirmation(email: string, orderNumber: string, total: number) {
  await transporter.sendMail({
    from: getFromAddress(),
    to: email,
    subject: `Order Confirmed - ${orderNumber}`,
    html: shell(
      'Order Confirmed!',
      `
        <p style="margin:0 0 12px 0;">Thank you for your order.</p>
        <p style="margin:0 0 6px 0;"><strong style="color:#fff;">Order Number:</strong> ${escape(orderNumber)}</p>
        <p style="margin:0 0 12px 0;"><strong style="color:#fff;">Total:</strong> $${total.toFixed(2)}</p>
        <p style="margin:0;">We'll send you another email when your order ships.</p>
      `,
    ),
  });
}

export async function sendOrderStatusUpdate(
  email: string,
  orderNumber: string,
  status: string
) {
  await transporter.sendMail({
    from: getFromAddress(),
    to: email,
    subject: `Order Update - ${orderNumber} - ${status}`,
    html: shell(
      'Order Status Update',
      `<p style="margin:0;">Your order <strong style="color:#fff;">${escape(orderNumber)}</strong> has been updated to: <strong style="color:#fff;">${escape(status)}</strong></p>`,
    ),
  });
}

export async function sendWelcomeEmail(email: string, name: string) {
  await transporter.sendMail({
    from: getFromAddress(),
    to: email,
    subject: `Welcome to ${APP_NAME}!`,
    html: shell(
      `Welcome, ${escape(name)}!`,
      `<p style="margin:0;">Thank you for creating an account with us. We're glad to have you here.</p>`,
    ),
  });
}

export interface ContactEmailInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export async function sendContactEmail({ name, email, subject, message }: ContactEmailInput) {
  const receiver = getContactReceiver();
  if (!receiver) throw new Error('No contact receiver email configured');

  const safeName = escape(name);
  const safeEmail = escape(email);
  const safeSubject = escape(subject);
  const safeMessage = escape(message).replace(/\n/g, '<br/>');
  const submittedAt = new Date().toISOString();

  await transporter.sendMail({
    from: getFromAddress(),
    to: receiver,
    replyTo: email,
    subject: `[Contact] ${subject} - from ${name}`,
    html: shell(
      'New contact form submission',
      `
        <p style="margin:0 0 16px 0;">You have received a new message from your website contact form.</p>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 16px 0;font-size:14px;">
          <tr>
            <td style="padding:6px 0;color:#a1a1aa;width:120px;">Name</td>
            <td style="padding:6px 0;color:#fff;">${safeName}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#a1a1aa;">Email</td>
            <td style="padding:6px 0;color:#fff;"><a href="mailto:${safeEmail}" style="color:#a78bfa;">${safeEmail}</a></td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#a1a1aa;">Subject</td>
            <td style="padding:6px 0;color:#fff;">${safeSubject}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#a1a1aa;vertical-align:top;">Message</td>
            <td style="padding:6px 0;color:#fff;">${safeMessage}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;color:#a1a1aa;">Submitted</td>
            <td style="padding:6px 0;color:#fff;">${submittedAt}</td>
          </tr>
        </table>
        <p style="margin:0;font-size:13px;color:#a1a1aa;">Reply directly to this email to respond to ${safeName}.</p>
      `,
    ),
  });
}

export async function sendContactAutoReply({ name, email }: { name: string; email: string }) {
  await transporter.sendMail({
    from: getFromAddress(),
    to: email,
    subject: `We received your message - ${APP_NAME}`,
    html: shell(
      `Thanks for reaching out, ${escape(name)}!`,
      `
        <p style="margin:0 0 12px 0;">We've received your message and our team will get back to you within 24 hours.</p>
        <p style="margin:0;">If you need urgent help, you can also reply directly to this email.</p>
      `,
    ),
  });
}

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const verifyUrl = `${APP_URL}/verify-email?token=${encodeURIComponent(token)}`;
  await transporter.sendMail({
    from: getFromAddress(),
    to: email,
    subject: `Verify your email - ${APP_NAME}`,
    html: shell(
      `Verify your email, ${escape(name)}`,
      `
        <p style="margin:0 0 16px 0;">Thanks for signing up for ${APP_NAME}. Please confirm your email address by clicking the button below.</p>
        <p style="margin:0 0 24px 0;">
          <a href="${verifyUrl}" style="display:inline-block;background-color:#a78bfa;color:#0b0b0f;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:15px;">Verify Email</a>
        </p>
        <p style="margin:0 0 8px 0;font-size:13px;color:#a1a1aa;">This link will expire in 24 hours.</p>
        <p style="margin:0;font-size:13px;color:#71717a;word-break:break-all;">If the button doesn't work, paste this URL into your browser:<br/>${verifyUrl}</p>
      `,
    ),
  });
}

export async function sendPasswordResetEmail(email: string, name: string, token: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${encodeURIComponent(token)}`;
  await transporter.sendMail({
    from: getFromAddress(),
    to: email,
    subject: `Reset your password - ${APP_NAME}`,
    html: shell(
      'Reset your password',
      `
        <p style="margin:0 0 16px 0;">Hi ${escape(name)}, we received a request to reset the password for your account.</p>
        <p style="margin:0 0 24px 0;">
          <a href="${resetUrl}" style="display:inline-block;background-color:#a78bfa;color:#0b0b0f;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:15px;">Reset Password</a>
        </p>
        <p style="margin:0 0 8px 0;font-size:13px;color:#a1a1aa;">This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
        <p style="margin:0;font-size:13px;color:#71717a;word-break:break-all;">If the button doesn't work, paste this URL into your browser:<br/>${resetUrl}</p>
      `,
      'Reset your password for ' + APP_NAME,
    ),
  });
}

export async function sendAbandonedCartEmail(
  email: string,
  name: string,
  items: { name: string; price: number; quantity: number; image: string }[],
  total: number,
  checkoutUrl: string,
) {
  const itemsHtml = items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #27272a;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="width:48px;padding-right:12px;">
                  ${item.image ? `<img src="${escape(item.image)}" alt="${escape(item.name)}" style="width:48px;height:48px;border-radius:6px;object-fit:cover;" />` : '<div style="width:48px;height:48px;border-radius:6px;background:#27272a;"></div>'}
                </td>
                <td style="font-size:14px;color:#e5e7eb;">${escape(item.name)}</td>
                <td style="font-size:14px;color:#a1a1aa;text-align:center;">x${item.quantity}</td>
                <td style="font-size:14px;color:#e5e7eb;text-align:right;">$${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            </table>
          </td>
        </tr>`,
    )
    .join('');

  await transporter.sendMail({
    from: getFromAddress(),
    to: email,
    subject: `Complete your order - ${APP_NAME}`,
    html: shell(
      `You left something behind, ${escape(name)}!`,
      `
        <p style="margin:0 0 8px 0;">You have items waiting in your cart. Complete your order before they sell out!</p>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0;">
          ${itemsHtml}
        </table>
        <p style="margin:16px 0 8px 0;font-size:16px;color:#fff;">Total: <strong>$${total.toFixed(2)}</strong></p>
        <p style="margin:0 0 24px 0;">
          <a href="${escape(checkoutUrl)}" style="display:inline-block;background-color:#a78bfa;color:#0b0b0f;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:15px;">Complete Your Order</a>
        </p>
        <p style="margin:0;font-size:13px;color:#71717a;">Your cart will be saved for 30 days. Don't miss out!</p>
      `,
      'Complete your purchase before items sell out',
    ),
  });
}
