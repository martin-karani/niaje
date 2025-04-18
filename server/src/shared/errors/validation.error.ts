/**
 * Validation Error
 * Thrown when input validation fails
 */
export class ValidationError extends Error {
  statusCode: number = 400;
  errors?: Record<string, string[]>;

  constructor(
    message: string = "Validation failed",
    errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ValidationError";
    this.errors = errors;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
