/**
 * Authorization Error
 * Thrown when a user attempts to access a resource they don't have permission for
 */
export class AuthorizationError extends Error {
  statusCode: number = 403;

  constructor(
    message: string = "You do not have permission to perform this action"
  ) {
    super(message);
    this.name = "AuthorizationError";
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}
