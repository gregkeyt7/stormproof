export class HttpError extends Error {
  status: number;
  statusCode: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.statusCode = status;
    this.details = details;
  }
}
