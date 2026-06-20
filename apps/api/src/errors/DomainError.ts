export class DomainError extends Error {
  statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}
