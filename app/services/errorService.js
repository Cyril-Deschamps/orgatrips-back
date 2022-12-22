export class AppError extends Error {
  isAppError = true;
  statusCode;
  message;

  constructor(statusCode, data) {
    super(data);
    this.statusCode = statusCode;
    this.message = JSON.stringify(data, null, 2);
  }
}

export function handleValidationError(error) {
  if (error.name === "SequelizeValidationError") {
    throw new AppError(
      400,
      error.errors.map((e) => e.message),
      error.stack,
    );
  } else if (error.name === "SequelizeUniqueConstraintError") {
    throw new AppError(
      400,
      error.errors.map((e) => e.message),
      error.stack,
    );
  }
}
