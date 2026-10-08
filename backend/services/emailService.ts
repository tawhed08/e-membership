import nodemailer from "nodemailer";

interface EmailMessage {
  email: string;
  subject: string;
  text: string;
  html: string;
}

interface ExpiryEmail extends EmailMessage {
  name: string;
  daysBefore: 30 | 7 | 1;
  expiryDate: Date;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function createTransporter():
  | { sendMail: (message: EmailMessage) => Promise<unknown> }
  | undefined {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  if (!host || !Number.isInteger(port) || !user || !pass || !from) {
    console.warn(
      "[Email Service] SMTP is not configured; outgoing email is disabled."
    );
    return undefined;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
  return {
    sendMail: (message) =>
      transporter.sendMail({
        from,
        to: message.email,
        subject: message.subject,
        text: message.text,
        html: message.html,
      }),
  };
}

export async function sendTransactionalEmail(
  message: EmailMessage
): Promise<boolean> {
  const transporter = createTransporter();
  if (!transporter) {
    return false;
  }
  await transporter.sendMail(message);
  return true;
}

export async function sendWelcomeEmail(
  email: string,
  name: string
): Promise<boolean> {
  return sendTransactionalEmail({
    email,
    subject: "Welcome to E-Membership",
    text: `Welcome, ${name}. Your E-Membership account is ready.`,
    html: `<h1>Welcome to E-Membership</h1><p>Hello ${escapeHtml(name)}, your account is ready. Sign in to explore membership plans.</p>`,
  });
}

export async function sendExpiryEmail({
  email,
  name,
  daysBefore,
  expiryDate,
}: Pick<ExpiryEmail, "email" | "name" | "daysBefore" | "expiryDate">): Promise<boolean> {
  const formattedExpiry = expiryDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return sendTransactionalEmail({
    email,
    subject: `Your membership expires in ${daysBefore} day${daysBefore === 1 ? "" : "s"}`,
    text: `Hello ${name}, your membership expires on ${formattedExpiry}. Please contact the membership team if you need assistance.`,
    html: `<p>Hello ${escapeHtml(name)},</p><p>Your membership expires on <strong>${formattedExpiry}</strong> (in ${daysBefore} day${daysBefore === 1 ? "" : "s"}).</p><p>Please contact the membership team if you need assistance.</p>`,
  });
}

export async function sendMembershipActivatedEmail(
  email: string,
  name: string,
  expiryDate: Date
): Promise<boolean> {
  const date = expiryDate.toLocaleDateString("en-GB");
  return sendTransactionalEmail({
    email,
    subject: "Your membership is active",
    text: `Hello ${name}, your membership is active until ${date}.`,
    html: `<p>Hello ${escapeHtml(name)},</p><p>Your membership is active until <strong>${date}</strong>.</p>`,
  });
}

export async function sendPaymentUpdateEmail(
  email: string,
  name: string,
  transactionId: string,
  approved: boolean
): Promise<boolean> {
  const status = approved ? "approved" : "not approved";
  return sendTransactionalEmail({
    email,
    subject: `Payment ${status}`,
    text: `Hello ${name}, your payment ${transactionId} was ${status}.`,
    html: `<p>Hello ${escapeHtml(name)}, your payment <strong>${escapeHtml(transactionId)}</strong> was ${status}.</p>`,
  });
}

export async function sendCertificateIssuedEmail(
  email: string,
  name: string,
  certificateId: string
): Promise<boolean> {
  return sendTransactionalEmail({
    email,
    subject: "Your membership certificate is ready",
    text: `Hello ${name}, certificate ${certificateId} has been issued.`,
    html: `<p>Hello ${escapeHtml(name)}, your certificate <strong>${escapeHtml(certificateId)}</strong> has been issued.</p>`,
  });
}
