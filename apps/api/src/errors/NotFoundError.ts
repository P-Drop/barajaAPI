import { DomainError } from './DomainError.js';

export class NotFoundError extends DomainError {
  statusCode = 404;
  constructor(message: string = 'Partida no encontrada') {
    super(message);
    this.name = 'NotFoundError';
  }
}
