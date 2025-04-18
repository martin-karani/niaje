/**
 * Subscription Limit Error
 * Thrown when a user hits the limits of their subscription plan
 */
export class SubscriptionLimitError extends Error {
  statusCode: number = 402; // Payment Required
  limit: string;
  plan: string;

  constructor(
    message: string = "You have reached the limits of your subscription plan",
    limit?: string,
    plan?: string
  ) {
    super(message);
    this.name = "SubscriptionLimitError";
    this.limit = limit || "unknown";
    this.plan = plan || "current";
    Object.setPrototypeOf(this, SubscriptionLimitError.prototype);
  }
}
