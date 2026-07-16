import { DomainError } from './DomainError.js';

export class UnauthorizedError extends DomainError {
  statusCode = 401;
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}
