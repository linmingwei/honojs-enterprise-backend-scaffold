export interface EmailSender {
  send(input: { to: string; subject: string; html: string }): Promise<void>;
}
