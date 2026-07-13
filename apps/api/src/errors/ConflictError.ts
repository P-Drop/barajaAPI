import { DomainError } from './DomainError.js';

export class ConflictError extends DomainError {
  statusCode = 409;
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}
