import type { AppConfig } from "@/shared/config/types";
import { createEmailSender } from "@/modules/notify/infrastructure/email-sender";

/**
 * The scaffold currently gives you an EmailSender abstraction.
 * A practical way to build on top of it is to define typed template functions.
 */

type WelcomeEmailInput = {
  productName: string;
  userName: string;
  loginUrl: string;
};

type BillingAlertEmailInput = {
  tenantName: string;
  planName: string;
  amount: string;
  payUrl: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderWelcomeEmail(input: WelcomeEmailInput) {
  return {
    subject: `Welcome to ${input.productName}`,
    html: `
      <h1>Welcome, ${escapeHtml(input.userName)}</h1>
      <p>Your account is ready.</p>
      <p><a href="${escapeHtml(input.loginUrl)}">Sign in</a></p>
    `,
  };
}

export function renderBillingAlertEmail(input: BillingAlertEmailInput) {
  return {
    subject: `${input.tenantName} payment required`,
    html: `
      <h1>Payment required</h1>
      <p>Tenant: ${escapeHtml(input.tenantName)}</p>
      <p>Plan: ${escapeHtml(input.planName)}</p>
      <p>Amount: ${escapeHtml(input.amount)}</p>
      <p><a href="${escapeHtml(input.payUrl)}">Complete payment</a></p>
    `,
  };
}

export async function sendWelcomeEmail(
  config: AppConfig,
  input: {
    to: string;
    template: WelcomeEmailInput;
  },
) {
  const emailSender = createEmailSender(config);
  if (!emailSender) {
    return { skipped: true, reason: "email_sender_not_enabled" };
  }

  const message = renderWelcomeEmail(input.template);
  await emailSender.send({
    to: input.to,
    subject: message.subject,
    html: message.html,
  });

  return { skipped: false };
}
