export interface PaymentProvider {
  createPayment(input: unknown): Promise<unknown>;
  verifyWebhook(input: unknown): Promise<unknown>;
}
