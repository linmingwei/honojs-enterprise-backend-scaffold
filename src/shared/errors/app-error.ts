export class AppError extends Error {
  constructor(
    message: string,
    public readonly status = 500,
    public readonly code = "internal_error",
  ) {
    super(message);
  }
}
