import type { AppConfig } from "@/shared/config/types";
import type { EmailSender } from "../domain/email-sender";

class StubEmailSender implements EmailSender {
  async send(input: { to: string; subject: string; html: string }) {
    console.info("stub_email_sender", input);
  }
}

export function createEmailSender(config: AppConfig): EmailSender | null {
  if (!config.features.notify.enabled) {
    return null;
  }

  switch (config.notify.emailProvider) {
    case "stub":
      return new StubEmailSender();
    case "none":
      return null;
  }
}
