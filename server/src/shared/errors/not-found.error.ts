/**
 * Not Found Error
 * Thrown when a requested resource cannot be found
 */
export class NotFoundError extends Error {
  statusCode: number = 404;

  constructor(message: string = "Resource not found") {
    super(message);
    this.name = "NotFoundError";
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}
