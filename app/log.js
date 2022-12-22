import { logDirectory, logLevel } from "./config/config.js";
import path from "path";
import winstonModule from "winston";
const { createLogger, format, transports } = winstonModule;
const { colorize, combine, label, printf, splat, timestamp } = format;

const getLabel = function (callingModule) {
  const parts = callingModule.split(path.sep);
  return parts[parts.length - 2] + "/" + parts.pop();
};

export default function (callingModule) {
  const logger = createLogger({
    format: combine(
      //label({ label: path.basename(process.mainModule.filename) }),
      label({ label: getLabel(callingModule) }),
      colorize(),
      timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
      splat(),
      printf(
        (info) =>
          `${info.timestamp} ${info.level} [${info.label}]: ${info.message}`,
      ),
    ),
    transports: [
      new transports.Console(),
      new transports.File({ filename: "server.log", dirname: logDirectory }),
    ],
    level: logLevel,
    exceptionHandlers: [
      new transports.File({ filename: "exception.log", dirname: logDirectory }),
      new transports.Console(),
    ],
    exitOnError: false,
  });
  logger.info("Logs set up done, captured 2 ways- console & file");
  return logger;
}
