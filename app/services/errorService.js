import loggerFactory from "../log";
const logger = loggerFactory(import.meta.url);

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

export function sendWebSocketError(error, ws) {
  logger.error("Websocket error : %s", error.message);
  if (error.isAppError && error.message) {
    return ws.send(
      `{ "type": -1, "message": "${
        error.statusCode
      } - ${error.message.replaceAll('"', "")}" }`,
    );
  }
  return ws.send(`{ "type": -1, "message": "500 - Une erreur est survenue" }`);
}
