export interface SmsSender {
  send(input: {
    phone: string;
    template: string;
    params: Record<string, string>;
  }): Promise<void>;
}
