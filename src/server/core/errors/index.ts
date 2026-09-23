import { AppError } from "./app.error";

export { AppError };

export class NotFoundError extends AppError {
  constructor(resource = "Resource", id?: string) {
    const message = id ? `${resource} with ID '${id}' not found` : `${resource} not found`;
    super(message, 404, "NOT_FOUND");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super(message, 403, "FORBIDDEN");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", errors: unknown = null) {
    super(message, 400, "VALIDATION_ERROR", errors);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(message, 409, "CONFLICT");
  }
}

export class PaymentRequiredError extends AppError {
  constructor(message = "This feature requires a higher subscription plan") {
    super(message, 402, "PLAN_LIMIT_EXCEEDED");
  }
}

export * from "./payment.errors";
