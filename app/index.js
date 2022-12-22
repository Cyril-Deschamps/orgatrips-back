// BASE SETUP
// =============================================================================

// call the packages we need
import express from "express"; // call express
import bodyParser from "body-parser";
import morgan from "morgan"; // for http loggin purpose
import compression from "compression";
import { apiPath, cors_origin, docPath } from "./config/config.js";
import router from "./routes";
import "./models";
import loggerFactory from "./log";

const app = express(); // define our app using express
const logger = loggerFactory(import.meta.url);

Error.stackTraceLimit = Infinity;

//enable CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin) {
    res.setHeader("Access-Control-Allow-Origin", "*");
  } else if (app.get("env") !== "production") {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else if (cors_origin.indexOf(origin) > -1) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Authorization, Origin, X-Requested-With, Content-Type, Accept, X-XSRF-TOKEN",
  );
  next();
});

app.options("*", (req, res) => res.sendStatus(200));

// setup the logger
// use morgan to log http requests
morgan.token("remote-user", (req) => req.headers.authorization);
morgan.token("body", (req) =>
  req.body
    ? typeof req.body !== "string"
      ? JSON.stringify(req.body, null, 2)
      : req.body
    : undefined,
);
app.use(
  morgan(
    ':remote-addr - :remote-user [:date[iso]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"',
  ),
);

app.use(compression());
// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(
  bodyParser.urlencoded({
    extended: true,
    limit: "5mb",
  }),
);
app.use(bodyParser.json({ limit: "1mb" }));
app.use((req, res, next) => {
  if (req.query.relations) {
    req.relations = new Proxy(
      Object.fromEntries(req.query.relations.map((rel) => [rel, true])),
      {
        get(obj, prop) {
          return prop in obj ? obj[prop] : false;
        },
      },
    );
  }
  next();
});

/**
 * Main error handling
 */
app.use((error, req, res, _next) => {
  logger.info("error handling");
  logger.error("%O", error);
  logger.error("%O", error.stack);
  if (error.isAppError) {
    return res.status(error.statusCode).send(error.message);
  }
  res.sendStatus(500);
});

//plug our router from routes.js to /api URI
app.use(apiPath, router);

if (app.get("env") === "development") {
  app.use(docPath, express.static("apidoc"));
}

export default app;
